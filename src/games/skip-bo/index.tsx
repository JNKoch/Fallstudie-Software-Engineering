import { useState } from "react";

import type { BoardGameModule } from "../types";
import {
  applySkipBoMove,
  createInitialSkipBoState,
  endTurn,
  type SkipBoState,
} from "./logic/skipBoLogic";
import styles from "./styles/SkipBo.module.css";

function SkipBoGame() {
  const [state, setState] = useState(createInitialSkipBoState(2));
  const [error, setError] = useState("");
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);

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
    setError("");
  }

  function handleSelectPile(foundationIndex: number) {
    if (selectedCardIndex === null) return;
    handlePlayCard(selectedCardIndex, foundationIndex);
  }

  function handleEndTurn() {
    try {
      setError("");
      setState((currentState) => endTurn(currentState, currentState.currentPlayerIndex));
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
              className={`${styles.card} ${currentPlayer.visibleStock.value === "SKIP" ? styles.cardSKIP : ""} ${
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

        <strong>Hand ({currentPlayer.cards.length} Karten):</strong>
        <div className={styles.hand}>
          {currentPlayer.cards.map((card, index) => (
            <button
              key={card.id}
              className={`${styles.card} ${card.value === "SKIP" ? styles.cardSKIP : ""} ${
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
            className={`${styles.stapel} ${selectedCardIndex !== null ? styles.stapelSelectable : ""}`}
            onClick={() => {
              if (selectedCardIndex !== null && onPlayCard) {
                onPlayCard(foundationIndex);
              }
            }}
            type="button"
            disabled={selectedCardIndex === null || disabled}
          >
            <p>Stapel {foundationIndex + 1}</p>
            <p>Nächst: {state.board.nextNeededValue[foundationIndex]}</p>
            {pile.length > 0 && (
              <div className={styles.card}>
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
