import { describe, expect, it } from "vitest";

import { gameRegistry, getGameById } from "./gameRegistry";

describe("gameRegistry", () => {
  it("contains board game metadata for the dashboard", () => {
    expect(gameRegistry).toHaveLength(2);
    expect(gameRegistry).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tic-tac-toe",
          title: "Tic-Tac-Toe",
          playerCount: "2 Spieler",
          difficulty: "easy",
        }),
        expect.objectContaining({
          id: "connect-four",
          title: "4 Gewinnt",
          playerCount: "2 Spieler",
          difficulty: "medium",
        }),
      ]),
    );
  });

  it("finds a game by id", () => {
    expect(getGameById("tic-tac-toe")?.title).toBe("Tic-Tac-Toe");
    expect(getGameById("connect-four")?.title).toBe("4 Gewinnt");
  });

  it("returns undefined for unknown ids", () => {
    expect(getGameById("unknown")).toBeUndefined();
  });
});
