import { useState } from "react";

import type { BoardGameModule } from "../types";
import {
  applySkipBoMove,
  createInitialSkipBoState,
  endTurn,
  discardHandCardAndEndTurn,
  type SkipBoState,
} from "./logic/skipBoLogic";
import styles from "./styles/SkipBo.module.css";

function getCardColorClass(value: string) {
  if (value === "SKIP") return styles.cardSKIP;
  const n = Number(value);
  if (n >= 1 && n <= 4) return styles.cardBlue;
  if (n >= 5 && n <= 8) return styles.cardGreen;
  if (n >= 9 && n <= 12) return styles.cardRed;
  return styles.card; // fallback
}

function SkipBoGame() {
  const [state, setState] = useState(createInitialSkipBoState(2));
  const [error, setError] = useState("");
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedDiscardTarget, setSelectedDiscardTarget] = useState<number | null>(null);

  const currentPlayer = state.players[state.currentPlayerIndex];


  const statusText =
    state.status === "won"
      ? `Spieler ${(state.winner ?? 0) + 1} hat gewonnen!`
      : `Spieler ${state.currentPlayerIndex + 1} ist am Zug.`;

  function handlePlayCard(cardIndex: number, foundationIndex: number) {
    try {
      setError("");
      // applySkipBoMove liefert nun bei einem ungültigen Zug den neuen Zustand mit einer message zurück
      const newState = applySkipBoMove(state, {
        playerIndex: state.currentPlayerIndex,
        cardIndex,
        foundationIndex,
      });
      setState(newState);
      setSelectedCardIndex(null);
      if (newState.message) {
        setError(newState.message);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Zug konnte nicht ausgefuehrt werden.");
    }
  }

  function handleSelectCard(cardIndex: number) {
    setSelectedCardIndex(selectedCardIndex === cardIndex ? null : cardIndex);
    setSelectedDiscardTarget(null);
    setError("");
  }

  function handleSelectDiscardPile(pIndex: number) {
    // If a hand-card is selected, use this as the discard target and end the turn
    if (selectedCardIndex !== null && selectedCardIndex >= 0) {
      // perform discard-and-end-turn
      try {
        setError("");
        setState((currentState) =>
          discardHandCardAndEndTurn(currentState, currentState.currentPlayerIndex, selectedCardIndex!, pIndex)
        );
        setSelectedCardIndex(null);
        setSelectedDiscardTarget(null);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Ablegen fehlgeschlagen.");
      }
      return;
    }

    // Otherwise toggle selecting this discard pile as a source to play from
    const encoded = -(2 + pIndex);
    setSelectedCardIndex(selectedCardIndex === encoded ? null : encoded);
    setSelectedDiscardTarget(selectedCardIndex === encoded ? null : pIndex);
    setError("");
  }

  function handleSelectPile(foundationIndex: number) {
    if (selectedCardIndex === null) return;
    handlePlayCard(selectedCardIndex, foundationIndex);
  }

  function handleEndTurn() {
    // Enforce that at end of turn a hand card must be discarded — if none selected or target not set, error
    if (selectedCardIndex === null || selectedCardIndex < 0) {
      setError("Wähle eine Handkarte aus, die du ablegen möchtest, bevor du den Zug beendest.");
      return;
    }
    if (selectedDiscardTarget === null) {
      setError("Wähle einen Ablage-Stapel (1-4) als Ziel für die abzulegende Karte.");
      return;
    }

    try {
      setError("");
      setState((currentState) =>
        discardHandCardAndEndTurn(currentState, currentState.currentPlayerIndex, selectedCardIndex!, selectedDiscardTarget!)
      );
      setSelectedCardIndex(null);
      setSelectedDiscardTarget(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Zug konnte nicht beendet werden.");
    }
  }

  function handleReset() {
    setError("");
    setState(createInitialSkipBoState(2));
  }

  return (
    <section className={styles.skipBo} aria-labelledby="skip-bo-title">
      <h2 id="skip-bo-title" className={styles.title}>
        Skip-Bo
      </h2>
      <p className={styles.description}>
        Kartenmischspiel, bei dem die Spieler ihre Karten auf Stapel von 1 bis 12 auslegen.
      </p>
      <p className={styles.description}>
        Lokales Spiel für zwei Spieler auf einem Gerät.
      </p>

      <p className={styles.status}>{statusText}</p>
      {selectedCardIndex !== null && (
        <p className={styles.info}>
          Karte ausgewählt. Klicke auf einen Stapel, um die Karte zu spielen.
        </p>
      )}

      <div className={styles.actions}>
        <button className={styles.resetButton} onClick={handleReset} type="button">
          Neues Spiel
        </button>
        {state.status === "playing" && (
          <button className={styles.resetButton} onClick={handleEndTurn} type="button">
            Ende Zug
          </button>
        )}
      </div>

      <SkipBoBoard state={state} onPlayCard={handleSelectPile} selectedCardIndex={selectedCardIndex} />

      <div className={styles.playerInfo}>
        <strong>Stapel ({currentPlayer.stockPile.length + (currentPlayer.visibleStock ? 1 : 0)}):</strong>
        <div className={styles.hand}>
          {currentPlayer.visibleStock ? (
            <button
              key={currentPlayer.visibleStock.id}
              className={`${styles.card} ${getCardColorClass(currentPlayer.visibleStock.value)} ${
                selectedCardIndex === -1 ? styles.cardSelected : ""
              }`}
              onClick={() => handleSelectCard(-1)}
              title={`Stapelkarte: ${currentPlayer.visibleStock.value}`}
              type="button"
              disabled={state.status !== "playing"}
            >
              <span className={styles.cardValue}>{currentPlayer.visibleStock.value}</span>
            </button>
          ) : (
            <div className={styles.cardBlank}>kein sichtbarer Stapel</div>
          )}
        </div>

      <strong>Deine Ablagestapel:</strong>
      <div className={styles.discardRow}>
        {currentPlayer.discardPiles.map((pile, pIndex) => (
            <button
            key={`discard-${pIndex}`}
            className={`${styles.card} ${getCardColorClass(pile[pile.length - 1]?.value ?? "") } ${
              selectedCardIndex === -(2 + pIndex) ? styles.cardSelected : ""
            } ${selectedDiscardTarget === pIndex ? styles.cardTarget : ""}`}
            onClick={() => handleSelectDiscardPile(pIndex)}
            title={pile.length > 0 ? `Ablage ${pIndex}: ${pile[pile.length - 1]?.value}` : `Ablage ${pIndex}: leer`}
              type="button"
              disabled={state.status !== "playing"}
            >
            {pile.length > 0 ? <span className={styles.cardValue}>{pile[pile.length - 1]?.value}</span> : <span className={styles.cardBlankSmall}>leer</span>}
            </button>
          ))}
        </div>

      <strong>Hand ({currentPlayer.cards.length} Karten):</strong>
      <div className={styles.hand}>
        {currentPlayer.cards.map((card, index) => (
          <button
            key={card.id}
            className={`${styles.card} ${getCardColorClass(card.value)} ${
              selectedCardIndex === index ? styles.cardSelected : ""
            }`}
            onClick={() => handleSelectCard(index)}
            title={`Karte ${index}: ${card.value}`}
            type="button"
            disabled={state.status !== "playing"}
          >
            <span className={styles.cardValue}>{card.value}</span>
          </button>
        ))}
      </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
    </section>
  );
}

function SkipBoBoard({
  state,
  onPlayCard,
  selectedCardIndex,
  disabled = false,
}: {
  state: SkipBoState;
  onPlayCard?: (foundationIndex: number) => void;
  selectedCardIndex?: number | null;
  disabled?: boolean;
}) {
  return (
    <div className={styles.gameBoard}>
      <h3>Stapel</h3>
      <div className={styles.board}>
        {state.board.foundationPiles.map((pile, foundationIndex) => (
          <button
            key={foundationIndex}
            className={`${styles.stapel} ${selectedCardIndex !== null ? styles.stapelSelectable : ""} ${
              state.board.foundationAwaitingChoice[foundationIndex] ? styles.stapelAwaiting : ""
            }`}
            onClick={() => {
              if (selectedCardIndex !== null && onPlayCard) {
                onPlayCard(foundationIndex);
              }
            }}
            type="button"
            disabled={selectedCardIndex === null || disabled}
          >
            <p>Stapel {foundationIndex + 1}</p>
            <p>
              {state.board.foundationAwaitingChoice[foundationIndex] ? (
                "Wartet: lege 2 (↑) oder 11 (↓)"
              ) : state.board.nextNeededValue[foundationIndex] === null ? (
                "Start: 1 oder 12"
              ) : (
                `Nächst: ${state.board.nextNeededValue[foundationIndex]} ${
                  state.board.foundationDirections[foundationIndex] === "down" ? "(↓)" : "(↑)"
                }`
              )}
            </p>
            {pile.length > 0 && (
              <div className={`${styles.card} ${getCardColorClass(pile[pile.length - 1]?.value ?? "")}`}>
                <span className={styles.cardValue}>{pile[pile.length - 1]?.value}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export { createInitialSkipBoState };

export const skipBoModule: BoardGameModule = {
  id: "skip-bo",
  title: "Skip-Bo",
  description: "Kartenmischspiel mit vier Stapeln. Lege Karten von 1 bis 12 ab!",
  playerCount: "2-6 Spieler",
  difficulty: "medium",
  shortRules: "Lege Karten von 1-12 ab. SKIP-Karten überspringen eine Nummer.",
  supportsOnlinePlay: true,
  createInitialState: createInitialSkipBoState,
  Component: SkipBoGame,
};
