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

  it("rejects unsupported game ids", () => {
    expect(() => applyRoomMove({}, "unknown", { cellIndex: 0, symbol: "X" })).toThrow(
      "Dieses Spiel unterstuetzt noch keine Online-Zuege.",
    );
  });
});
