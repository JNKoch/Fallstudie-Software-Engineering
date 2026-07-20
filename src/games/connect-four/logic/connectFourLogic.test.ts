import { describe, expect, it } from "vitest";

import {
  applyConnectFourMove,
  CONNECT_FOUR_COLUMNS,
  CONNECT_FOUR_ROWS,
  createInitialConnectFourState,
  getAvailableRow,
  getConnectFourResult,
  type ConnectFourCell,
  type ConnectFourState,
} from "./connectFourLogic";

function createStateWithBoard(board: ConnectFourCell[], lastMove: ConnectFourState["lastMove"]): ConnectFourState {
  return {
    board,
    currentPlayer: "red",
    status: "playing",
    winner: null,
    lastMove,
  };
}

describe("connectFourLogic", () => {
  it("drops a disc into the lowest open row", () => {
    const state = applyConnectFourMove(createInitialConnectFourState(), {
      columnIndex: 0,
      player: "red",
    });

    const bottomLeftIndex = (CONNECT_FOUR_ROWS - 1) * CONNECT_FOUR_COLUMNS;

    expect(state.board[bottomLeftIndex]).toBe("red");
    expect(state.currentPlayer).toBe("yellow");
  });

  it("stacks discs in the same column", () => {
    const firstMove = applyConnectFourMove(createInitialConnectFourState(), {
      columnIndex: 3,
      player: "red",
    });
    const secondMove = applyConnectFourMove(firstMove, {
      columnIndex: 3,
      player: "yellow",
    });

    expect(getAvailableRow(secondMove.board, 3)).toBe(CONNECT_FOUR_ROWS - 3);
    expect(secondMove.board[(CONNECT_FOUR_ROWS - 1) * CONNECT_FOUR_COLUMNS + 3]).toBe("red");
    expect(secondMove.board[(CONNECT_FOUR_ROWS - 2) * CONNECT_FOUR_COLUMNS + 3]).toBe("yellow");
  });

  it("detects a horizontal win", () => {
    const board = Array<ConnectFourCell>(CONNECT_FOUR_ROWS * CONNECT_FOUR_COLUMNS).fill(null);
    const bottomRow = CONNECT_FOUR_ROWS - 1;

    for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
      board[bottomRow * CONNECT_FOUR_COLUMNS + columnIndex] = "red";
    }

    const result = getConnectFourResult(
      createStateWithBoard(board, {
        rowIndex: bottomRow,
        columnIndex: 3,
        cellIndex: bottomRow * CONNECT_FOUR_COLUMNS + 3,
      }),
    );

    expect(result).toEqual({ status: "won", winner: "red" });
  });

  it("detects a vertical win", () => {
    let state = createInitialConnectFourState();

    state = applyConnectFourMove(state, { columnIndex: 0, player: "red" });
    state = applyConnectFourMove(state, { columnIndex: 1, player: "yellow" });
    state = applyConnectFourMove(state, { columnIndex: 0, player: "red" });
    state = applyConnectFourMove(state, { columnIndex: 1, player: "yellow" });
    state = applyConnectFourMove(state, { columnIndex: 0, player: "red" });
    state = applyConnectFourMove(state, { columnIndex: 1, player: "yellow" });
    state = applyConnectFourMove(state, { columnIndex: 0, player: "red" });

    expect(state.status).toBe("won");
    expect(state.winner).toBe("red");
  });

  it("detects a diagonal win", () => {
    let state = createInitialConnectFourState();

    state = applyConnectFourMove(state, { columnIndex: 0, player: "red" });
    state = applyConnectFourMove(state, { columnIndex: 1, player: "yellow" });
    state = applyConnectFourMove(state, { columnIndex: 1, player: "red" });
    state = applyConnectFourMove(state, { columnIndex: 2, player: "yellow" });
    state = applyConnectFourMove(state, { columnIndex: 4, player: "red" });
    state = applyConnectFourMove(state, { columnIndex: 2, player: "yellow" });
    state = applyConnectFourMove(state, { columnIndex: 2, player: "red" });
    state = applyConnectFourMove(state, { columnIndex: 3, player: "yellow" });
    state = applyConnectFourMove(state, { columnIndex: 4, player: "red" });
    state = applyConnectFourMove(state, { columnIndex: 3, player: "yellow" });
    state = applyConnectFourMove(state, { columnIndex: 5, player: "red" });
    state = applyConnectFourMove(state, { columnIndex: 3, player: "yellow" });
    state = applyConnectFourMove(state, { columnIndex: 3, player: "red" });

    expect(state.status).toBe("won");
    expect(state.winner).toBe("red");
  });

  it("rejects moves in a full column", () => {
    let state = createInitialConnectFourState();

    for (let moveIndex = 0; moveIndex < CONNECT_FOUR_ROWS; moveIndex += 1) {
      state = applyConnectFourMove(state, {
        columnIndex: 0,
        player: state.currentPlayer,
      });
    }

    expect(() =>
      applyConnectFourMove(state, {
        columnIndex: 0,
        player: state.currentPlayer,
      }),
    ).toThrow("Diese Spalte ist voll.");
  });
});
