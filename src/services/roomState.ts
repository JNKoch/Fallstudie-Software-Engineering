import { applyConnectFourMove, type ConnectFourState } from "../games/connect-four/logic/connectFourLogic";
import { applyTicTacToeMove, type TicTacToeState } from "../games/tic-tac-toe/logic/ticTacToeLogic";

export function applyRoomMove(state: unknown, gameId: string, movePayload: unknown): unknown {
  if (gameId === "tic-tac-toe") {
    return applyTicTacToeMove(state as TicTacToeState, movePayload as never);
  }

  if (gameId === "connect-four") {
    return applyConnectFourMove(state as ConnectFourState, movePayload as never);
  }

  throw new Error("Dieses Spiel unterstützt noch keine Online-Züge.");
}
