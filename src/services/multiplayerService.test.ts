import { describe, expect, it, vi } from "vitest";

import { createMultiplayerService } from "./multiplayerService";

function createQueryBuilder(result: unknown = { data: null, error: null }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn(async () => result),
  };
  return builder;
}

describe("multiplayerService", () => {
  it("creates a room through the database rpc", async () => {
    const rpc = vi.fn(async (fn: string, args: unknown) => {
      expect(fn).toBe("create_game_room");
      expect(args).toEqual({
        p_game_id: "tic-tac-toe",
        p_initial_state: { board: [] },
      });
      return { data: "room-1", error: null };
    });
    const service = createMultiplayerService({ rpc } as never, () => "user-1");

    const room = await service.createRoom("tic-tac-toe", { board: [] });

    expect(room).toEqual({ id: "room-1" });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("joins a room through the database rpc", async () => {
    const rpc = vi.fn(async (fn: string, args: unknown) => {
      expect(fn).toBe("join_game_room");
      expect(args).toEqual({
        p_room_id: "room-1",
      });
      return { data: { room_id: "room-1", symbol: "O" }, error: null };
    });
    const service = createMultiplayerService({ rpc } as never, () => "user-2");

    await service.joinRoom("room-1");

    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("returns null when a room row is not found", async () => {
    const rooms = createQueryBuilder({
      data: null,
      error: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" },
    });
    const from = vi.fn(() => rooms);
    const service = createMultiplayerService({ from } as never, () => "user-1");

    await expect(service.loadRoom("missing-room")).resolves.toBeNull();
  });

  it("raises database errors while loading rooms", async () => {
    const rooms = createQueryBuilder({
      data: null,
      error: { code: "42P17", message: "infinite recursion detected in policy for relation room_players" },
    });
    const from = vi.fn(() => rooms);
    const service = createMultiplayerService({ from } as never, () => "user-1");

    await expect(service.loadRoom("room-1")).rejects.toThrow("infinite recursion detected");
  });

  it("rejects moves from the wrong player before writing", async () => {
    const service = createMultiplayerService({ rpc: vi.fn() } as never, () => "user-2");

    await expect(
      service.submitMove({
        room: {
          id: "room-1",
          game_id: "tic-tac-toe",
          room_revision: 3,
          state: { board: Array(9).fill(null), currentPlayer: "X", status: "playing", winner: null },
          current_player: "X",
          winner: null,
        },
        playerSymbol: "O",
        movePayload: { cellIndex: 0, symbol: "O" },
      }),
    ).rejects.toThrow("X ist am Zug.");
  });

  it("submits tic-tac-toe moves through an atomic rpc and reloads the room", async () => {
    const roomRecord = {
      id: "room-1",
      game_id: "tic-tac-toe",
      status: "active",
      state: {
        board: ["X", null, null, null, null, null, null, null, null],
        currentPlayer: "O",
        status: "playing",
        winner: null,
      },
      current_player: "O",
      winner: null,
      room_revision: 4,
      room_players: [{ user_id: "user-1", symbol: "X", player_order: 1 }],
    };
    const rooms = createQueryBuilder({ data: roomRecord, error: null });
    const rpc = vi.fn(async (fn: string, args: unknown) => {
      expect(fn).toBe("submit_tic_tac_toe_move");
      expect(args).toEqual({
        p_room_id: "room-1",
        p_expected_room_revision: 3,
        p_cell_index: 0,
      });
      return { data: 4, error: null };
    });
    const from = vi.fn((table: string) => {
      expect(table).toBe("game_rooms");
      return rooms;
    });
    const service = createMultiplayerService({ from, rpc } as never, () => "user-1");

    const updatedRoom = await service.submitMove({
      room: {
        id: "room-1",
        game_id: "tic-tac-toe",
        room_revision: 3,
        state: { board: Array(9).fill(null), currentPlayer: "X", status: "playing", winner: null },
        current_player: "X",
        winner: null,
      },
      playerSymbol: "X",
      movePayload: { cellIndex: 0, symbol: "X" },
    });

    expect(updatedRoom).toEqual(roomRecord);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("game_rooms");
  });
});
