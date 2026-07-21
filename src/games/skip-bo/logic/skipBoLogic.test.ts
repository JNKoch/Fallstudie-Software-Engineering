import { describe, expect, it } from "vitest";

import {
  createInitialSkipBoState,
  discardHandCardAndEndTurn,
  endTurn,
} from "./skipBoLogic";

describe("skipBoLogic", () => {
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
});
