import { skipBoModule } from "./skip-bo";
import { ticTacToeModule } from "./tic-tac-toe";
import { connectFourModule } from "./connect-four";
import type { BoardGameModule } from "./types";

export const gameRegistry: BoardGameModule[] = [ticTacToeModule, skipBoModule, connectFourModule];

export function getGameById(gameId: string): BoardGameModule | undefined {
  return gameRegistry.find((game) => game.id === gameId);
}
