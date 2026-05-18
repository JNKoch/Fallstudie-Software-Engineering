export type TicTacToeSymbol = "X" | "O";
export type TicTacToeCell = TicTacToeSymbol | null;
export type TicTacToeStatus = "playing" | "won" | "draw";

export interface TicTacToeState {
  board: TicTacToeCell[];
  currentPlayer: TicTacToeSymbol;
  status: TicTacToeStatus;
  winner: TicTacToeSymbol | null;
}

export interface TicTacToeMove {
  cellIndex: number;
  symbol: TicTacToeSymbol;
}

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createInitialTicTacToeState(): TicTacToeState {
  return {
    board: Array<TicTacToeCell>(9).fill(null),
    currentPlayer: "X",
    status: "playing",
    winner: null,
  };
}

export function getTicTacToeResult(state: TicTacToeState): Pick<TicTacToeState, "status" | "winner"> {
  for (const [a, b, c] of winningLines) {
    const symbol = state.board[a];

    if (symbol && symbol === state.board[b] && symbol === state.board[c]) {
      return { status: "won", winner: symbol };
    }
  }

  if (state.board.every(Boolean)) {
    return { status: "draw", winner: null };
  }

  return { status: "playing", winner: null };
}

export function applyTicTacToeMove(state: TicTacToeState, move: TicTacToeMove): TicTacToeState {
  if (state.status !== "playing") {
    throw new Error("Dieses Spiel ist bereits beendet.");
  }

  if (move.symbol !== state.currentPlayer) {
    throw new Error(`${state.currentPlayer} ist am Zug.`);
  }

  if (!Number.isInteger(move.cellIndex) || move.cellIndex < 0 || move.cellIndex > 8) {
    throw new Error("Dieses Feld existiert nicht.");
  }

  if (state.board[move.cellIndex]) {
    throw new Error("Dieses Feld ist bereits belegt.");
  }

  const board = [...state.board];
  board[move.cellIndex] = move.symbol;
  const nextPlayer = move.symbol === "X" ? "O" : "X";
  const result = getTicTacToeResult({ ...state, board });

  return {
    board,
    currentPlayer: result.status === "playing" ? nextPlayer : state.currentPlayer,
    status: result.status,
    winner: result.winner,
  };
}
