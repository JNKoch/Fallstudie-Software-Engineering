export type ConnectFourPlayer = "red" | "yellow";
export type ConnectFourCell = ConnectFourPlayer | null;
export type ConnectFourStatus = "playing" | "won" | "draw";

export interface ConnectFourState {
  board: ConnectFourCell[];
  currentPlayer: ConnectFourPlayer;
  status: ConnectFourStatus;
  winner: ConnectFourPlayer | null;
  lastMove: ConnectFourMoveResult | null;
}

export interface ConnectFourMove {
  columnIndex: number;
  player: ConnectFourPlayer;
}

export interface ConnectFourMoveResult {
  rowIndex: number;
  columnIndex: number;
  cellIndex: number;
}

export const CONNECT_FOUR_ROWS = 6;
export const CONNECT_FOUR_COLUMNS = 7;
const WIN_LENGTH = 4;

const directions = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

function getCellIndex(rowIndex: number, columnIndex: number): number {
  return rowIndex * CONNECT_FOUR_COLUMNS + columnIndex;
}

function isInsideBoard(rowIndex: number, columnIndex: number): boolean {
  return (
    rowIndex >= 0 &&
    rowIndex < CONNECT_FOUR_ROWS &&
    columnIndex >= 0 &&
    columnIndex < CONNECT_FOUR_COLUMNS
  );
}

export function createInitialConnectFourState(): ConnectFourState {
  return {
    board: Array<ConnectFourCell>(CONNECT_FOUR_ROWS * CONNECT_FOUR_COLUMNS).fill(null),
    currentPlayer: "red",
    status: "playing",
    winner: null,
    lastMove: null,
  };
}

export function getAvailableRow(board: ConnectFourCell[], columnIndex: number): number | null {
  if (!Number.isInteger(columnIndex) || columnIndex < 0 || columnIndex >= CONNECT_FOUR_COLUMNS) {
    return null;
  }

  for (let rowIndex = CONNECT_FOUR_ROWS - 1; rowIndex >= 0; rowIndex -= 1) {
    if (!board[getCellIndex(rowIndex, columnIndex)]) {
      return rowIndex;
    }
  }

  return null;
}

export function isConnectFourColumnFull(state: ConnectFourState, columnIndex: number): boolean {
  return getAvailableRow(state.board, columnIndex) === null;
}

export function getConnectFourResult(
  state: ConnectFourState,
  lastMove: ConnectFourMoveResult | null = state.lastMove,
): Pick<ConnectFourState, "status" | "winner"> {
  if (lastMove) {
    const player = state.board[lastMove.cellIndex];

    if (player) {
      for (const [rowDirection, columnDirection] of directions) {
        let connected = 1;

        for (const stepDirection of [-1, 1]) {
          let rowIndex = lastMove.rowIndex + rowDirection * stepDirection;
          let columnIndex = lastMove.columnIndex + columnDirection * stepDirection;

          while (isInsideBoard(rowIndex, columnIndex) && state.board[getCellIndex(rowIndex, columnIndex)] === player) {
            connected += 1;
            rowIndex += rowDirection * stepDirection;
            columnIndex += columnDirection * stepDirection;
          }
        }

        if (connected >= WIN_LENGTH) {
          return { status: "won", winner: player };
        }
      }
    }
  }

  if (state.board.every(Boolean)) {
    return { status: "draw", winner: null };
  }

  return { status: "playing", winner: null };
}

export function applyConnectFourMove(state: ConnectFourState, move: ConnectFourMove): ConnectFourState {
  if (state.status !== "playing") {
    throw new Error("Dieses Spiel ist bereits beendet.");
  }

  if (move.player !== state.currentPlayer) {
    throw new Error(`${getConnectFourPlayerLabel(state.currentPlayer)} ist am Zug.`);
  }

  if (!Number.isInteger(move.columnIndex) || move.columnIndex < 0 || move.columnIndex >= CONNECT_FOUR_COLUMNS) {
    throw new Error("Diese Spalte existiert nicht.");
  }

  const rowIndex = getAvailableRow(state.board, move.columnIndex);

  if (rowIndex === null) {
    throw new Error("Diese Spalte ist voll.");
  }

  const board = [...state.board];
  const cellIndex = getCellIndex(rowIndex, move.columnIndex);
  board[cellIndex] = move.player;

  const lastMove = { rowIndex, columnIndex: move.columnIndex, cellIndex };
  const result = getConnectFourResult({ ...state, board, lastMove }, lastMove);
  const nextPlayer = move.player === "red" ? "yellow" : "red";

  return {
    board,
    currentPlayer: result.status === "playing" ? nextPlayer : state.currentPlayer,
    status: result.status,
    winner: result.winner,
    lastMove,
  };
}

export function getConnectFourPlayerLabel(player: ConnectFourPlayer): string {
  return player === "red" ? "Rot" : "Gelb";
}
