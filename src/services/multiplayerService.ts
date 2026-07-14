import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseClient } from "../lib/supabaseClient";

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
  room_revision: number;
  room_players?: RoomPlayer[];
}

interface QueryError {
  code?: string;
  message: string;
}

interface QueryResult<T> {
  data: T | null;
  error: QueryError | null;
}

type LooseClient = Pick<SupabaseClient, "from" | "channel" | "removeChannel" | "rpc">;

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
      ensureUserId(getUserId);
      const result = (await requireSupabase(client).rpc("create_game_room", {
        p_game_id: gameId,
        p_initial_state: initialState,
      })) as QueryResult<string>;

      return { id: assertResult(result) };
    },

    async joinRoom(roomId: string) {
      ensureUserId(getUserId);
      const result = (await requireSupabase(client).rpc("join_game_room", {
        p_room_id: roomId,
      })) as QueryResult<{ room_id: string; symbol: "X" | "O" }>;

      return assertResult(result);
    },

    async loadRoom(roomId: string) {
      const result = (await requireSupabase(client)
        .from("game_rooms")
        .select("id, game_id, status, state, current_player, winner, room_revision, room_players(user_id, symbol, player_order)")
        .eq("id", roomId)
        .single()) as QueryResult<GameRoom>;

      if (result.error) {
        if (result.error.code === "PGRST116") {
          return null;
        }

        throw new Error(result.error.message);
      }

      if (!result.data) {
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

      ensureUserId(getUserId);

      if (room.game_id !== "tic-tac-toe") {
        throw new Error("Dieses Spiel unterstuetzt noch keine Online-Zuege.");
      }

      const cellIndex =
        typeof movePayload === "object" &&
        movePayload !== null &&
        "cellIndex" in movePayload &&
        typeof movePayload.cellIndex === "number"
          ? movePayload.cellIndex
          : null;

      if (cellIndex === null) {
        throw new Error("Der Zug ist ungueltig.");
      }

      const result = (await requireSupabase(client).rpc("submit_tic_tac_toe_move", {
        p_room_id: room.id,
        p_expected_room_revision: room.room_revision,
        p_cell_index: cellIndex,
      })) as QueryResult<number>;

      assertResult(result);

      const updatedRoom = await this.loadRoom(room.id);

      if (!updatedRoom) {
        throw new Error("Raum konnte nach dem Zug nicht geladen werden.");
      }

      return updatedRoom;
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
