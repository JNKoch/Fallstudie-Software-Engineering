import { describe, expect, it } from "vitest";

import {
  applyTicTacToeMove,
  createInitialTicTacToeState,
  getTicTacToeResult,
} from "./ticTacToeLogic";

describe("ticTacToeLogic", () => {
  it("detects a winning row", () => {
    const result = getTicTacToeResult({
      board: ["X", "X", "X", null, "O", null, "O", null, null],
      currentPlayer: "O",
      status: "won",
      winner: "X",
    });

    expect(result).toEqual({ status: "won", winner: "X" });
  });

  it("detects a draw when no cells are open", () => {
    const result = getTicTacToeResult({
      board: ["X", "O", "X", "X", "O", "O", "O", "X", "X"],
      currentPlayer: "O",
      status: "draw",
      winner: null,
    });

    expect(result).toEqual({ status: "draw", winner: null });
  });

  it("rejects moves on occupied cells", () => {
    const state = createInitialTicTacToeState();
    const firstMove = applyTicTacToeMove(state, { cellIndex: 0, symbol: "X" });

    expect(() => applyTicTacToeMove(firstMove, { cellIndex: 0, symbol: "O" })).toThrow(
      "Dieses Feld ist bereits belegt.",
    );
  });

  it("applies a valid move and advances the turn", () => {
    const state = applyTicTacToeMove(createInitialTicTacToeState(), {
      cellIndex: 4,
      symbol: "X",
    });

    expect(state.board[4]).toBe("X");
    expect(state.currentPlayer).toBe("O");
    expect(state.status).toBe("playing");
  });
});
