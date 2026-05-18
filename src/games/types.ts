import type { ComponentType } from "react";

export type GameDifficulty = "easy" | "medium" | "hard";

export interface BoardGameModule {
  id: string;
  title: string;
  description: string;
  playerCount: string;
  difficulty: GameDifficulty;
  shortRules: string;
  Component: ComponentType;
  supportsOnlinePlay?: boolean;
  createInitialState?: () => unknown;
}
