import { describe, expect, it, vi } from "vitest";

import { createMultiplayerService } from "./multiplayerService";

function createQueryBuilder(result: unknown = { data: null, error: null }) {
  const builder = {
    insert: vi.fn(() => builder),
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn(async () => result),
  };
  return builder;
}

describe("multiplayerService", () => {
  it("creates a room and registers the creator as player X", async () => {
    const rooms = createQueryBuilder({ data: { id: "room-1" }, error: null });
    const players = createQueryBuilder({ data: { room_id: "room-1", symbol: "X" }, error: null });
    const from = vi.fn((table: string) => {
      if (table === "game_rooms") {
        return rooms;
      }

      expect(table).toBe("room_players");
      return players;
    });
    const service = createMultiplayerService({ from } as never, () => "user-1");

    const room = await service.createRoom("tic-tac-toe", { board: [] });

    expect(room).toEqual({ id: "room-1" });
    expect(rooms.insert).toHaveBeenCalledWith({
      created_by: "user-1",
      game_id: "tic-tac-toe",
      state: { board: [] },
      status: "waiting",
      current_player: "X",
      winner: null,
    });
    expect(players.insert).toHaveBeenCalledWith({
      room_id: "room-1",
      user_id: "user-1",
      symbol: "X",
      player_order: 1,
    });
  });

  it("joins a room as the second player", async () => {
    const players = createQueryBuilder({ data: { room_id: "room-1", symbol: "O" }, error: null });
    const service = createMultiplayerService({ from: vi.fn(() => players) } as never, () => "user-2");

    await service.joinRoom("room-1");

    expect(players.insert).toHaveBeenCalledWith({
      room_id: "room-1",
      user_id: "user-2",
      symbol: "O",
      player_order: 2,
    });
  });

  it("rejects moves from the wrong player before writing", async () => {
    const service = createMultiplayerService({ from: vi.fn() } as never, () => "user-2");

    await expect(
      service.submitMove({
        room: {
          id: "room-1",
          game_id: "tic-tac-toe",
          state: { board: Array(9).fill(null), currentPlayer: "X", status: "playing", winner: null },
          current_player: "X",
          winner: null,
        },
        playerSymbol: "O",
        movePayload: { cellIndex: 0, symbol: "O" },
      }),
    ).rejects.toThrow("X ist am Zug.");
  });
});
