import { applyTicTacToeMove, type TicTacToeState } from "../games/tic-tac-toe/logic/ticTacToeLogic";

export function applyRoomMove(state: unknown, gameId: string, movePayload: unknown): unknown {
  if (gameId === "tic-tac-toe") {
    return applyTicTacToeMove(state as TicTacToeState, movePayload as never);
  }

  throw new Error("Dieses Spiel unterstuetzt noch keine Online-Zuege.");
}
