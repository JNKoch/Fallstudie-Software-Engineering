
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

export interface GameBoard {
  foundationPiles: Card[][];
  nextNeededValue: (string | number)[];
}

export type SkipBoStatus = "playing" | "won" | "draw";

export interface SkipBoState {
  players: PlayerHand[];
  board: GameBoard;
  currentPlayerIndex: number;
  status: SkipBoStatus;
  winner: number | null;
  message: string;
}

export interface SkipBoMove {
  playerIndex: number;
  cardIndex: number;
  foundationIndex: number;
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;
  
  for (let i = 1; i <= 12; i++) {
    for (let j = 0; j < 8; j++) {
      deck.push({
        id: `card-${id++}`,
        value: String(i) as CardValue,
      });
    }
  }
  
  for (let i = 0; i < 18; i++) {
    deck.push({
      id: `card-skip-${i}`,
      value: "SKIP",
    });
  }
  
  return deck.sort(() => Math.random() - 0.5);
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
  const deck = createDeck();
  let deckIndex = 0;

  const players: PlayerHand[] = [];
  for (let i = 0; i < playerCount; i++) {
    const hand: Card[] = [];
    for (let j = 0; j < 5; j++) {
      hand.push(deck[deckIndex++]);
    }

    const stockPile: Card[] = [];
    const stockSize = 10; // Jeder Spieler erhält nun genau 10 Karten im Startstapel
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
    board: {
      foundationPiles: Array(4).fill(null).map(() => []),
      nextNeededValue: [1, 1, 1, 1],
    },
    currentPlayerIndex: 0,
    status: "playing",
    winner: null,
    message: "Spiel gestartet!",
  };
}

export function canPlayCard(cardValue: CardValue, nextNeeded: string | number): boolean {
  if (cardValue === "SKIP") return true;
  if (nextNeeded === "complete") return false;
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

  // move.cardIndex === -1 bedeutet: oberste Karte des Stock-Piles (visibleStock) spielen
  const playingFromStock = move.cardIndex === -1;

  if (!playingFromStock && (move.cardIndex < 0 || move.cardIndex >= player.cards.length)) {
    throw new Error("Ungültige Kartennummer.");
  }

  if (move.foundationIndex < 0 || move.foundationIndex >= 4) {
    throw new Error("Ungültige Foundation-Pile.");
  }

  const card = playingFromStock ? player.visibleStock : player.cards[move.cardIndex];
  if (!card) {
    throw new Error("Keine Karte zum Spielen vorhanden.");
  }

  const nextNeeded = state.board.nextNeededValue[move.foundationIndex];

  if (!canPlayCard(card.value, nextNeeded)) {
    throw new Error(`Du kannst diese Karte nicht spielen. Benötigt: ${nextNeeded}`);
  }

  const newState = JSON.parse(JSON.stringify(state)) as SkipBoState;
  const newPlayer = newState.players[move.playerIndex];

  // Karte vom jeweiligen Ort entfernen
  if (playingFromStock) {
    // visibleStock wurde gespielt; decke die nächste Karte vom stockPile auf
    newState.board.foundationPiles[move.foundationIndex].push(card);
    newPlayer.visibleStock = newPlayer.stockPile.length > 0 ? newPlayer.stockPile.pop()! : null;
  } else {
    const removed = newPlayer.cards.splice(move.cardIndex, 1)[0];
    newState.board.foundationPiles[move.foundationIndex].push(removed);
  }

  // nextNeededValue aktualisieren
  const playedValue = card.value;
  if (playedValue === "SKIP") {
    if (nextNeeded === "complete") {
      newState.board.nextNeededValue[move.foundationIndex] = "complete";
    } else {
      const nextValue = Number(nextNeeded) + 1;
      if (nextValue > 12) {
        newState.board.nextNeededValue[move.foundationIndex] = 1;
      } else {
        newState.board.nextNeededValue[move.foundationIndex] = nextValue;
      }
    }
  } else {
    const nextValue = Number(playedValue) + 1;
    if (nextValue > 12) {
      newState.board.nextNeededValue[move.foundationIndex] = 1;
    } else {
      newState.board.nextNeededValue[move.foundationIndex] = nextValue;
    }
  }

  // Gewinnbedingung: keine Karten in Hand, kein sichtbarer Stock und kein Stock-Deck, sowie alle Discard-Piles leer
  const noHand = newPlayer.cards.length === 0;
  const noStock = newPlayer.stockPile.length === 0 && newPlayer.visibleStock === null;
  const discardEmpty = newPlayer.discardPiles.every((pile) => pile.length === 0);
  if (noHand && noStock && discardEmpty) {
    newState.status = "won";
    newState.winner = move.playerIndex;
    newState.message = `Spieler ${move.playerIndex + 1} hat gewonnen!`;
    return newState;
  }

  newState.message = "";
  return newState;
}

export function drawCard(state: SkipBoState, playerIndex: number): SkipBoState {
  if (playerIndex !== state.currentPlayerIndex) {
    throw new Error("Spieler sind nicht am Zug.");
  }

  const newState = JSON.parse(JSON.stringify(state)) as SkipBoState;
  const player = newState.players[playerIndex];

  // Ziehe von stockPile in die Hand (wie vorher), falls vorhanden
  if (player.stockPile.length > 0) {
    const card = player.stockPile.pop();
    if (card) {
      player.cards.push(card);
    }
  } else if (player.visibleStock) {
    // Falls nur visibleStock vorhanden ist (und stockPile leer), kann diese in die Hand gezogen werden
    player.cards.push(player.visibleStock);
    player.visibleStock = null;
  }

  newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
  return newState;
}
