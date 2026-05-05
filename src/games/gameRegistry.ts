import { ticTacToeModule } from "./tic-tac-toe";
import type { BoardGameModule } from "./types";

export const gameRegistry: BoardGameModule[] = [ticTacToeModule];

export function getGameById(gameId: string): BoardGameModule | undefined {
  return gameRegistry.find((game) => game.id === gameId);
}
