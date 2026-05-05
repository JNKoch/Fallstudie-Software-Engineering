import { describe, expect, it } from "vitest";

import { gameRegistry, getGameById } from "./gameRegistry";

describe("gameRegistry", () => {
  it("contains board game metadata for the dashboard", () => {
    expect(gameRegistry).toHaveLength(1);
    expect(gameRegistry[0]).toMatchObject({
      id: "tic-tac-toe",
      title: "Tic-Tac-Toe",
      playerCount: "2 Spieler",
      difficulty: "easy",
    });
  });

  it("finds a game by id", () => {
    expect(getGameById("tic-tac-toe")?.title).toBe("Tic-Tac-Toe");
  });

  it("returns undefined for unknown ids", () => {
    expect(getGameById("unknown")).toBeUndefined();
  });
});
