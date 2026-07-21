
export type CardValue = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "SKIP";

export interface Card {
  id: string;
  value: CardValue;
}

export interface PlayerHand {
  id: string;
  cards: Card[];
  stockPile: Card[];
  visibleStock: Card | null;
  discardPiles: Card[][];
}

export type FoundationDirection = "up" | "down" | null;

export interface GameBoard {
  foundationPiles: Card[][];
  nextNeededValue: (number | null)[];
  foundationDirections: FoundationDirection[];
  foundationAwaitingChoice: boolean[]; // true when a SKIP started the pile and awaits 2 or 11
}

export type SkipBoStatus = "playing" | "won" | "draw";

export interface SkipBoState {
  players: PlayerHand[];
  /** Gemeinsamer Nachziehstapel zum Auffüllen der Handkarten. */
  drawPile: Card[];
  board: GameBoard;
  currentPlayerIndex: number;
  status: SkipBoStatus;
  winner: number | null;
  message: string;
}

export interface SkipBoMove {
  playerIndex: number;
  // cardIndex encoding:
  // >=0 : index in hand
  // -1 : visibleStock
  // -2..-5 : discard pile index = -(cardIndex + 2)
  cardIndex: number;
  foundationIndex: number;
}

export const MAX_SKIP_BO_PLAYERS = 6;
const HAND_SIZE = 5;
const STOCK_SIZE = 10;
export const INITIAL_DRAW_PILE_SIZE = 500;

function createDeck(cardCount: number): Card[] {
  const deck: Card[] = [];
  const cardValues: CardValue[] = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "SKIP", "SKIP",
  ];

  for (let index = 0; index < cardCount; index += 1) {
    deck.push({
      id: `card-${index}`,
      value: cardValues[index % cardValues.length],
    });
  }

  return shuffleArray(deck);
}

/**
 * Deep clone a SkipBoState using explicit object construction instead of JSON serialization.
 * This ensures all nested arrays and card objects are properly isolated between clones.
 */
function cloneSkipBoState(state: SkipBoState): SkipBoState {
  return {
    status: state.status,
    currentPlayerIndex: state.currentPlayerIndex,
    winner: state.winner,
    message: state.message,
    drawPile: state.drawPile.map((card) => ({ ...card })),
    players: state.players.map((player) => ({
      id: player.id,
      cards: player.cards.map((card) => ({ ...card })),
      stockPile: player.stockPile.map((card) => ({ ...card })),
      visibleStock: player.visibleStock ? { ...player.visibleStock } : null,
      discardPiles: player.discardPiles.map((pile) => pile.map((card) => ({ ...card }))),
    })),
    board: {
      foundationPiles: state.board.foundationPiles.map((pile) => pile.map((card) => ({ ...card }))),
      nextNeededValue: [...state.board.nextNeededValue],
      foundationDirections: [...state.board.foundationDirections],
      foundationAwaitingChoice: [...state.board.foundationAwaitingChoice],
    },
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createInitialSkipBoState(playerCount: number = 2): SkipBoState {
  const deck = createDeck(INITIAL_DRAW_PILE_SIZE + playerCount * (HAND_SIZE + STOCK_SIZE));
  let deckIndex = 0;

  const players: PlayerHand[] = [];
  for (let i = 0; i < playerCount; i++) {
    const hand: Card[] = [];
    for (let j = 0; j < HAND_SIZE; j++) {
      hand.push(deck[deckIndex++]);
    }

    const stockPile: Card[] = [];
    const stockSize = STOCK_SIZE; // Nach pop() bleiben 9 verdeckte Karten im Stapel
    for (let j = 0; j < stockSize; j++) {
      if (deckIndex < deck.length) {
        stockPile.push(deck[deckIndex++]);
      }
    }

    // Die oberste Karte des Stapels ist sichtbar/spielbar — als visibleStock speichern
    const visibleStock = stockPile.length > 0 ? stockPile.pop()! : null;

    players.push({
      id: `player-${i}`,
      cards: hand,
      stockPile,
      visibleStock,
      discardPiles: [[], [], [], []],
    });
  }

  return {
    players,
    // Alle nicht ausgeteilten Karten bilden den gemeinsamen Nachziehstapel.
    // Der persönliche Spielerstapel darf ausschließlich durch Ausspielen seiner
    // sichtbaren Karte kleiner werden.
    drawPile: deck.slice(deckIndex),
    board: {
      foundationPiles: Array(4).fill(null).map(() => []),
      nextNeededValue: [null, null, null, null],
      foundationDirections: [null, null, null, null],
      foundationAwaitingChoice: [false, false, false, false],
    },
    currentPlayerIndex: 0,
    status: "playing",
    winner: null,
    message: "Spiel gestartet!",
  };
}

/** Fügt einen weiteren Spieler mit Hand- und Spielerstapel hinzu. */
export function addSkipBoPlayer(state: SkipBoState): SkipBoState {
  if (state.players.length >= MAX_SKIP_BO_PLAYERS) {
    throw new Error(`Es können maximal ${MAX_SKIP_BO_PLAYERS} Spieler teilnehmen.`);
  }

  const requiredCards = HAND_SIZE + STOCK_SIZE;
  if (state.drawPile.length < requiredCards) {
    throw new Error("Nicht genügend Karten, um einen weiteren Spieler hinzuzufügen.");
  }

  const newState = cloneSkipBoState(state);
  const cards = Array.from({ length: HAND_SIZE }, () => newState.drawPile.pop()!);
  const stockCards = Array.from({ length: STOCK_SIZE }, () => newState.drawPile.pop()!);

  newState.players.push({
    id: `player-${newState.players.length}`,
    cards,
    stockPile: stockCards.slice(0, -1),
    visibleStock: stockCards[stockCards.length - 1],
    discardPiles: [[], [], [], []],
  });
  newState.message = `Spieler ${newState.players.length} wurde hinzugefügt.`;

  return newState;
}

export function canPlayCard(
  cardValue: CardValue,
  nextNeeded: number | null,
  direction: FoundationDirection | null,
  awaitingChoice: boolean,
  skipCountOnPile: number = 0
): boolean {
  // If a SKIP previously started the pile and we are awaiting choice:
  // N SKIPs allow (N+1) or (12-N) to set direction, or another SKIP to stack
  if (awaitingChoice) {
    if (cardValue === "SKIP") return true; // Allow stacking more SKIPs
    const decisionHigh = skipCountOnPile + 1;
    const decisionLow = 12 - skipCountOnPile;
    return Number(cardValue) === decisionHigh || Number(cardValue) === decisionLow;
  }

  // SKIP weiterhin als Joker erlauben (wenn not awaiting choice)
  if (cardValue === "SKIP") return true;

  // Wenn Stapel leer ist, darf nur mit 1 oder 12 begonnen werden
  if (nextNeeded === null) {
    return cardValue === "1" || cardValue === "12";
  }

  // Sonstige Fälle: Zahl muss exakt dem nextNeeded entsprechen
  return Number(cardValue) === nextNeeded;
}

export function applySkipBoMove(
  state: SkipBoState,
  move: SkipBoMove
): SkipBoState {
  if (state.status !== "playing") {
    throw new Error("Das Spiel ist bereits beendet.");
  }

  if (move.playerIndex !== state.currentPlayerIndex) {
    throw new Error("Spieler sind nicht am Zug.");
  }

  const player = state.players[move.playerIndex];

  // move.cardIndex encoding:
  // >= 0 : index in hand
  // -1 : visibleStock
  // <= -2 : discard pile (pileIndex = -(cardIndex + 2))
  const playingFromStock = move.cardIndex === -1;
  const playingFromDiscard = move.cardIndex <= -2;

  // Validate hand card index (only for positive values)
  if (!playingFromStock && !playingFromDiscard && (move.cardIndex < 0 || move.cardIndex >= player.cards.length)) {
    throw new Error("Ungültige Kartennummer.");
  }

  // Validate discard pile index
  if (playingFromDiscard) {
    const pileIndex = -(move.cardIndex + 2);
    if (pileIndex < 0 || pileIndex >= 4) {
      throw new Error("Ungültiger Ablage-Stapel.");
    }
  }

  if (move.foundationIndex < 0 || move.foundationIndex >= 4) {
    throw new Error("Ungültige Foundation-Pile.");
  }

  let card: Card | undefined;
  if (playingFromStock) {
    card = player.visibleStock ?? undefined;
  } else if (playingFromDiscard) {
    // discard pile source
    const pileIndex = -(move.cardIndex + 2);
    const pile = player.discardPiles[pileIndex];
    card = pile && pile.length > 0 ? pile[pile.length - 1] : undefined;
  } else {
    card = player.cards[move.cardIndex];
  }

  if (!card) {
    throw new Error("Keine Karte zum Spielen vorhanden.");
  }

  const nextNeeded = state.board.nextNeededValue[move.foundationIndex];
  const direction = state.board.foundationDirections[move.foundationIndex];
  const awaitingChoice = state.board.foundationAwaitingChoice[move.foundationIndex];
  const pileEmpty = state.board.foundationPiles[move.foundationIndex].length === 0;
  const pile = state.board.foundationPiles[move.foundationIndex];
  
  // Count SKIP cards on the pile for awaitingChoice logic
  const skipCountOnPile = pile.filter((c) => c.value === "SKIP").length;

  if (!canPlayCard(card.value, nextNeeded, direction, awaitingChoice, skipCountOnPile)) {
    const failedState = cloneSkipBoState(state);
    if (awaitingChoice) {
      const decisionHigh = skipCountOnPile + 1;
      const decisionLow = 12 - skipCountOnPile;
      if (skipCountOnPile === 12) {
        failedState.message = `Dieser Stapel ist voll (12 SKIPs). Nur SKIP kann noch gespielt werden.`;
      } else if (decisionHigh > 12 || decisionLow < 1) {
        failedState.message = `Dieser Stapel wartet (${skipCountOnPile} SKIPs). Nur SKIP kann noch gespielt werden.`;
      } else {
        failedState.message = `Dieser Stapel wartet auf die Richtung: lege ${decisionHigh} (↑) oder ${decisionLow} (↓).`;
      }
    } else if (pileEmpty) {
      failedState.message = `Leerer Stapel: spiele 1 oder 12, um den Stapel zu starten.`;
    } else {
      failedState.message = `Du kannst diese Karte nicht spielen. Benötigt: ${nextNeeded}`;
    }
    return failedState;
  }

  const newState = cloneSkipBoState(state);
  const newPlayer = newState.players[move.playerIndex];

  // Karte vom jeweiligen Ort entfernen und auf Foundation legen
  if (playingFromStock) {
    // Use the cloned newPlayer.visibleStock (from newState) to avoid referencing original-state objects
    const played = newPlayer.visibleStock;
    if (!played) {
      throw new Error("Keine Karte zum Spielen vorhanden.");
    }
    newState.board.foundationPiles[move.foundationIndex].push(played);
    newPlayer.visibleStock = newPlayer.stockPile.length > 0 ? newPlayer.stockPile.pop()! : null;
  } else if (playingFromDiscard) {
    const pileIndex = -(move.cardIndex + 2);
    newState.board.foundationPiles[move.foundationIndex].push(
      newPlayer.discardPiles[pileIndex].pop() as Card
    );
  } else {
    const removed = newPlayer.cards.splice(move.cardIndex, 1)[0];
    newState.board.foundationPiles[move.foundationIndex].push(removed);
  }
 
  // Update direction and nextNeeded based on played card and previous state
  const playedValue = newState.board.foundationPiles[move.foundationIndex][
    newState.board.foundationPiles[move.foundationIndex].length - 1
  ].value;
  // If pile was empty, set direction when starting with 1 -> up, 12 -> down.
  // If SKIP started the pile previously, we may be resolving that awaitingChoice now by playing 2 or 11.
  const wasAwaitingChoice = state.board.foundationAwaitingChoice[move.foundationIndex];
  if (pileEmpty) {
    if (playedValue === "1") {
      newState.board.foundationDirections[move.foundationIndex] = "up";
      newState.board.nextNeededValue[move.foundationIndex] = 2;
      newState.board.foundationAwaitingChoice[move.foundationIndex] = false;
    } else if (playedValue === "12") {
      newState.board.foundationDirections[move.foundationIndex] = "down";
      newState.board.nextNeededValue[move.foundationIndex] = 11;
      newState.board.foundationAwaitingChoice[move.foundationIndex] = false;
    } else if (playedValue === "SKIP") {
      // SKIP started the pile — mark awaiting choice so next play must be 2 or 11
      newState.board.foundationDirections[move.foundationIndex] = null;
      newState.board.nextNeededValue[move.foundationIndex] = null;
      newState.board.foundationAwaitingChoice[move.foundationIndex] = true;
    } else {
      // should not happen due to canPlayCard, but safeguard
      newState.board.foundationDirections[move.foundationIndex] = "up";
      newState.board.nextNeededValue[move.foundationIndex] = 2;
      newState.board.foundationAwaitingChoice[move.foundationIndex] = false;
    }
  } else if (wasAwaitingChoice) {
    // resolving SKIP-started pile by playing a decision card
    // The decision card is (skipCount + 1) for up or (12 - skipCount) for down
    const playedNum = Number(playedValue);
    const decisionHigh = skipCountOnPile + 1;
    const decisionLow = 12 - skipCountOnPile;
    
    if (playedValue === "SKIP") {
      // Another SKIP: stay in awaitingChoice
      newState.board.foundationAwaitingChoice[move.foundationIndex] = true;
    } else if (playedNum === decisionHigh) {
      // Play up direction
      newState.board.foundationDirections[move.foundationIndex] = "up";
      newState.board.nextNeededValue[move.foundationIndex] = decisionHigh + 1;
      newState.board.foundationAwaitingChoice[move.foundationIndex] = false;
    } else if (playedNum === decisionLow) {
      // Play down direction
      newState.board.foundationDirections[move.foundationIndex] = "down";
      newState.board.nextNeededValue[move.foundationIndex] = decisionLow - 1;
      newState.board.foundationAwaitingChoice[move.foundationIndex] = false;
    } else {
      // should not be allowed by canPlayCard
      newState.board.foundationAwaitingChoice[move.foundationIndex] = true;
    }
  } else {
    const dir = newState.board.foundationDirections[move.foundationIndex];
    if (playedValue === "SKIP") {
      const completesPile = (dir === "down" && nextNeeded === 1) || (dir !== "down" && nextNeeded === 12);
      if (completesPile) {
        // Die SKIP-Karte ersetzt die letzte Zahl der Folge und beendet den Stapel.
        newState.board.foundationPiles[move.foundationIndex] = [];
        newState.board.nextNeededValue[move.foundationIndex] = null;
        newState.board.foundationDirections[move.foundationIndex] = null;
        newState.board.foundationAwaitingChoice[move.foundationIndex] = false;
      } else if (dir === "down") {
        newState.board.nextNeededValue[move.foundationIndex] = Number(nextNeeded) - 1;
      } else {
        newState.board.nextNeededValue[move.foundationIndex] = Number(nextNeeded) + 1;
      }
    } else {
      // numeric card played
      if (dir === "down") {
        const nextValue = Number(playedValue) - 1;
        if (nextValue < 1) {
          // Sequence complete (12→1 down), clear the pile
          newState.board.foundationPiles[move.foundationIndex] = [];
          newState.board.nextNeededValue[move.foundationIndex] = null;
          newState.board.foundationDirections[move.foundationIndex] = null;
          newState.board.foundationAwaitingChoice[move.foundationIndex] = false;
        } else {
          newState.board.nextNeededValue[move.foundationIndex] = nextValue;
        }
      } else {
        const nextValue = Number(playedValue) + 1;
        if (nextValue > 12) {
          // Sequence complete (1→12 up), clear the pile
          newState.board.foundationPiles[move.foundationIndex] = [];
          newState.board.nextNeededValue[move.foundationIndex] = null;
          newState.board.foundationDirections[move.foundationIndex] = null;
          newState.board.foundationAwaitingChoice[move.foundationIndex] = false;
        } else {
          newState.board.nextNeededValue[move.foundationIndex] = nextValue;
        }
      }
    }
  }

  // Gewinnbedingung: Spieler gewinnt sobald sein Startstapel komplett leer ist (inkl. visibleStock).
  const stackEmpty = newPlayer.stockPile.length === 0 && newPlayer.visibleStock === null;
  if (stackEmpty) {
    newState.status = "won";
    newState.winner = move.playerIndex;
    newState.message = `Spieler ${move.playerIndex + 1} hat gewonnen!`;
    return newState;
  }

  // Wenn alle Handkarten innerhalb desselben Zuges gespielt wurden, fülle die Hand automatisch auf 5 auf.
  if (newPlayer.cards.length === 0) {
    refillHand(newPlayer, newState.drawPile);
  }

  newState.message = "";
  return newState;
}

/**
 * Discard a hand card into one of four discard piles and then end the current player's turn.
 * This enforces the rule: at the end of each turn a hand card must be discarded.
 */
export function discardHandCardAndEndTurn(
  state: SkipBoState,
  playerIndex: number,
  handCardIndex: number,
  discardPileIndex: number
): SkipBoState {
  if (playerIndex !== state.currentPlayerIndex) {
    throw new Error("Spieler sind nicht am Zug.");
  }
  if (handCardIndex < 0 || handCardIndex >= state.players[playerIndex].cards.length) {
    throw new Error("Ungültige Hand-Kartennummer zum Ablegen.");
  }
  if (discardPileIndex < 0 || discardPileIndex >= 4) {
    throw new Error("Ungültiger Ablage-Stapel.");
  }

  const newState = cloneSkipBoState(state);
  const player = newState.players[playerIndex];

  const card = player.cards.splice(handCardIndex, 1)[0];
  player.discardPiles[discardPileIndex].push(card);

  // Now end the turn (refill next player's hand)
  return endTurn(newState, playerIndex);
}

/**
 * Refill a player's hand up to 5 cards from the shared draw pile.
 * The personal stock pile is never used to replenish a hand.
 */
function refillHand(player: PlayerHand, drawPile: Card[]) {
  while (player.cards.length < 5 && drawPile.length > 0) {
    player.cards.push(drawPile.pop()!);
  }
}

/**
 * End the current player's turn and start the next player's turn.
 * At the start of the incoming player's turn, ensure their hand is topped up to 5 cards.
 */
export function endTurn(state: SkipBoState, playerIndex: number): SkipBoState {
  if (playerIndex !== state.currentPlayerIndex) {
    throw new Error("Spieler sind nicht am Zug.");
  }

  const newState = cloneSkipBoState(state);
  // advance to next player
  newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;

  const nextPlayer = newState.players[newState.currentPlayerIndex];
  // Refill next player's hand from the common draw pile.
  refillHand(nextPlayer, newState.drawPile);

  return newState;
}
