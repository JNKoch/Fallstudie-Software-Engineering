import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseClient } from "../lib/supabaseClient";
import { applyRoomMove } from "./roomState";

export interface RoomPlayer {
  user_id: string;
  symbol: "X" | "O";
  player_order: number;
}

export interface GameRoom {
  id: string;
  game_id: string;
  status?: "waiting" | "active" | "finished";
  state: unknown;
  current_player: "X" | "O" | null;
  winner: string | null;
  room_players?: RoomPlayer[];
}

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

type LooseClient = Pick<SupabaseClient, "from" | "channel" | "removeChannel">;

function requireSupabase(client: LooseClient | null): LooseClient {
  if (!client) {
    throw new Error("Supabase ist lokal nicht konfiguriert.");
  }

  return client;
}

function ensureUserId(getUserId: () => string | null): string {
  const userId = getUserId();

  if (!userId) {
    throw new Error("Bitte melde dich an.");
  }

  return userId;
}

function assertResult<T>(result: QueryResult<T>): T {
  if (result.error) {
    throw new Error(result.error.message);
  }

  if (!result.data) {
    throw new Error("Keine Daten gefunden.");
  }

  return result.data;
}

export function createMultiplayerService(client: LooseClient | null, getUserId: () => string | null) {
  return {
    async createRoom(gameId: string, initialState: unknown) {
      const userId = ensureUserId(getUserId);
      const result = (await requireSupabase(client)
        .from("game_rooms")
        .insert({
          created_by: userId,
          game_id: gameId,
          state: initialState,
          status: "waiting",
          current_player: "X",
          winner: null,
        })
        .select("id")
        .single()) as QueryResult<{ id: string }>;

      const room = assertResult(result);

      const membershipResult = (await requireSupabase(client)
        .from("room_players")
        .insert({
          room_id: room.id,
          user_id: userId,
          symbol: "X",
          player_order: 1,
        })
        .select("room_id, symbol")
        .single()) as QueryResult<{ room_id: string; symbol: "X" }>;

      assertResult(membershipResult);

      return room;
    },

    async joinRoom(roomId: string, symbol: "X" | "O" = "O", playerOrder = 2) {
      const userId = ensureUserId(getUserId);
      const result = (await requireSupabase(client)
        .from("room_players")
        .insert({
          room_id: roomId,
          user_id: userId,
          symbol,
          player_order: playerOrder,
        })
        .select("room_id, symbol")
        .single()) as QueryResult<{ room_id: string; symbol: "X" | "O" }>;

      if (symbol === "O") {
        await requireSupabase(client).from("game_rooms").update({ status: "active" }).eq("id", roomId);
      }

      return assertResult(result);
    },

    async loadRoom(roomId: string) {
      const result = (await requireSupabase(client)
        .from("game_rooms")
        .select("id, game_id, status, state, current_player, winner, room_players(user_id, symbol, player_order)")
        .eq("id", roomId)
        .single()) as QueryResult<GameRoom>;

      if (result.error || !result.data) {
        return null;
      }

      return result.data;
    },

    async submitMove({
      room,
      playerSymbol,
      movePayload,
    }: {
      room: GameRoom;
      playerSymbol: "X" | "O";
      movePayload: unknown;
    }) {
      if (room.current_player && playerSymbol !== room.current_player) {
        throw new Error(`${room.current_player} ist am Zug.`);
      }

      const nextState = applyRoomMove(room.state, room.game_id, movePayload);
      const nextRoomState = nextState as { currentPlayer?: "X" | "O"; winner?: string | null; status?: string };
      const userId = ensureUserId(getUserId);

      await requireSupabase(client).from("game_moves").insert({
        room_id: room.id,
        user_id: userId,
        move_payload: movePayload,
      });

      const result = (await requireSupabase(client)
        .from("game_rooms")
        .update({
          state: nextState,
          current_player: nextRoomState.currentPlayer ?? room.current_player,
          winner: nextRoomState.winner ?? null,
          status: nextRoomState.status === "playing" ? "active" : "finished",
        })
        .eq("id", room.id)
        .select("id, game_id, status, state, current_player, winner, room_players(user_id, symbol, player_order)")
        .single()) as QueryResult<GameRoom>;

      return assertResult(result);
    },

    subscribeToRoom(roomId: string, onChange: () => void) {
      const activeClient = requireSupabase(client);
      const channel = activeClient
        .channel(`room:${roomId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
          onChange,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
          onChange,
        )
        .subscribe();

      return {
        unsubscribe() {
          void activeClient.removeChannel(channel);
        },
      };
    },
  };
}

export function createAuthedMultiplayerService(userId: string | null) {
  return createMultiplayerService(supabaseClient, () => userId);
}
