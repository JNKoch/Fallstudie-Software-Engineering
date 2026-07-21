import { describe, expect, it } from "vitest";

import {
  addSkipBoPlayer,
  applySkipBoMove,
  createInitialSkipBoState,
  discardHandCardAndEndTurn,
  endTurn,
  INITIAL_DRAW_PILE_SIZE,
} from "./skipBoLogic";

describe("skipBoLogic", () => {
  it("startet mit zehn Karten pro Spielerstapel und 500 Nachziehkarten", () => {
    const state = createInitialSkipBoState();

    expect(state.drawPile).toHaveLength(INITIAL_DRAW_PILE_SIZE);
    for (const player of state.players) {
      expect(player.stockPile).toHaveLength(9);
      expect(player.visibleStock).not.toBeNull();
    }
  });

  it("zieht beim Spielerwechsel nur vom gemeinsamen Nachziehstapel", () => {
    const state = createInitialSkipBoState();
    const incomingPlayer = state.players[1];
    const stockCount = incomingPlayer.stockPile.length;
    const visibleStockId = incomingPlayer.visibleStock?.id;
    const drawPileCount = state.drawPile.length;

    incomingPlayer.cards.pop();
    const nextState = endTurn(state, 0);

    expect(nextState.players[1].cards).toHaveLength(5);
    expect(nextState.players[1].stockPile).toHaveLength(stockCount);
    expect(nextState.players[1].visibleStock?.id).toBe(visibleStockId);
    expect(nextState.drawPile).toHaveLength(drawPileCount - 1);
  });

  it("verändert den Spielerstapel nicht beim Ablegen und Beenden eines Zuges", () => {
    const state = createInitialSkipBoState();
    const stockCounts = state.players.map((player) => player.stockPile.length);
    const visibleStockIds = state.players.map((player) => player.visibleStock?.id);

    const nextState = discardHandCardAndEndTurn(state, 0, 0, 0);

    expect(nextState.players.map((player) => player.stockPile.length)).toEqual(stockCounts);
    expect(nextState.players.map((player) => player.visibleStock?.id)).toEqual(visibleStockIds);
  });

  it("fügt Spieler bis zur Obergrenze von sechs mit eigenen Kartenstapeln hinzu", () => {
    let state = createInitialSkipBoState();

    for (let playerCount = 3; playerCount <= 6; playerCount += 1) {
      state = addSkipBoPlayer(state);
      const addedPlayer = state.players[playerCount - 1];

      expect(state.players).toHaveLength(playerCount);
      expect(addedPlayer.cards).toHaveLength(5);
      expect(addedPlayer.stockPile).toHaveLength(9);
      expect(addedPlayer.visibleStock).not.toBeNull();
    }

    expect(() => addSkipBoPlayer(state)).toThrow("Es können maximal 6 Spieler teilnehmen.");
  });

  it.each([
    { direction: "up" as const, values: Array.from({ length: 11 }, (_, index) => String(index + 1)), nextNeeded: 12 },
    { direction: "down" as const, values: Array.from({ length: 11 }, (_, index) => String(12 - index)), nextNeeded: 1 },
  ])("leert einen mit SKIP beendeten $direction-Stapel", ({ direction, values, nextNeeded }) => {
    const state = createInitialSkipBoState();
    state.players[0].cards = [{ id: "finishing-skip", value: "SKIP" }];
    state.board.foundationPiles[0] = values.map((value, index) => ({
      id: `foundation-${index}`,
      value: value as "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12",
    }));
    state.board.foundationDirections[0] = direction;
    state.board.nextNeededValue[0] = nextNeeded;

    const nextState = applySkipBoMove(state, { playerIndex: 0, cardIndex: 0, foundationIndex: 0 });

    expect(nextState.board.foundationPiles[0]).toEqual([]);
    expect(nextState.board.nextNeededValue[0]).toBeNull();
    expect(nextState.board.foundationDirections[0]).toBeNull();
  });
});
