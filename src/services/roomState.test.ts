import { describe, expect, it } from "vitest";

import { applyRoomMove } from "./roomState";

describe("applyRoomMove", () => {
  it("applies valid Tic-Tac-Toe moves", () => {
    const state = applyRoomMove(
      {
        board: [null, null, null, null, null, null, null, null, null],
        currentPlayer: "X",
        status: "playing",
        winner: null,
      },
      "tic-tac-toe",
      { cellIndex: 0, symbol: "X" },
    );

    expect(state).toMatchObject({
      board: ["X", null, null, null, null, null, null, null, null],
      currentPlayer: "O",
      status: "playing",
    });
  });

  it("applies valid 4 Gewinnt moves", () => {
    const state = applyRoomMove(
      {
        board: Array(42).fill(null),
        currentPlayer: "red",
        status: "playing",
        winner: null,
        lastMove: null,
      },
      "connect-four",
      { columnIndex: 0, player: "red" },
    );

    expect(state).toMatchObject({
      currentPlayer: "yellow",
      status: "playing",
      lastMove: { rowIndex: 5, columnIndex: 0, cellIndex: 35 },
    });
  });

  it("rejects unsupported game ids", () => {
    expect(() => applyRoomMove({}, "unknown", { cellIndex: 0, symbol: "X" })).toThrow(
      "Dieses Spiel unterstützt noch keine Online-Züge.",
    );
  });
});
