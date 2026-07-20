import { useState } from "react";

import type { BoardGameModule } from "../types";
import {
  applySkipBoMove,
  createInitialSkipBoState,
  drawCard,
  type SkipBoState,
} from "./logic/skipBoLogic";
import styles from "./styles/SkipBo.module.css";

function SkipBoGame() {
  const [state, setState] = useState(createInitialSkipBoState(2));
  const [error, setError] = useState("");

  const currentPlayer = state.players[state.currentPlayerIndex];
  const statusText =
    state.status === "won"
      ? `Spieler ${(state.winner ?? 0) + 1} hat gewonnen!`
      : `Spieler ${state.currentPlayerIndex + 1} ist am Zug.`;

  function handlePlayCard(cardIndex: number, foundationIndex: number) {
    try {
      setError("");
      setState((currentState) =>
        applySkipBoMove(currentState, {
          playerIndex: currentState.currentPlayerIndex,
          cardIndex,
          foundationIndex,
        })
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Zug konnte nicht ausgefuehrt werden.");
    }
  }

  function handleDrawCard() {
    try {
      setError("");
      setState((currentState) => drawCard(currentState, currentState.currentPlayerIndex));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Karte konnte nicht gezogen werden.");
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
        Kartenmischspiel, bei dem die Spieler ihre Karten auf Foundation-Piles von 1 bis 12 auslegen.
      </p>
      <p className={styles.description}>
        Lokales Spiel für zwei Spieler auf einem Gerät.
      </p>

      <p className={styles.status}>{statusText}</p>

      <div className={styles.actions}>
        <button className={styles.resetButton} onClick={handleReset} type="button">
          Neues Spiel
        </button>
        {state.status === "playing" && (
          <button className={styles.resetButton} onClick={handleDrawCard} type="button">
            Karte ziehen
          </button>
        )}
      </div>

      <SkipBoBoard state={state} onPlayCard={handlePlayCard} />

      <div className={styles.playerInfo}>
        <strong>Hand ({currentPlayer.cards.length} Karten):</strong>
        <div className={styles.hand}>
          {currentPlayer.cards.map((card, index) => (
            <button
              key={card.id}
              className={`${styles.card} ${card.value === "SKIP" ? styles.cardSKIP : ""}`}
              onClick={() => {
                const foundationIndex = 0;
                handlePlayCard(index, foundationIndex);
              }}
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
  disabled = false,
}: {
  state: SkipBoState;
  onPlayCard?: (cardIndex: number, foundationIndex: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.gameBoard}>
      <h3>Foundation-Piles</h3>
      <div className={styles.board}>
        {state.board.foundationPiles.map((pile, foundationIndex) => (
          <div key={foundationIndex} className={styles.pile}>
            <p>Pile {foundationIndex + 1}</p>
            <p>Nächst: {state.board.nextNeededValue[foundationIndex]}</p>
            {pile.length > 0 && (
              <div className={styles.card}>
                <span className={styles.cardValue}>{pile[pile.length - 1]?.value}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { createInitialSkipBoState };

export const skipBoModule: BoardGameModule = {
  id: "skip-bo",
  title: "Skip-Bo",
  description: "Kartenmischspiel mit vier Foundation-Piles. Lege Karten von 1 bis 12 ab!",
  playerCount: "2-6 Spieler",
  difficulty: "medium",
  shortRules: "Lege Karten von 1-12 ab. SKIP-Karten überspringen eine Nummer.",
  supportsOnlinePlay: true,
  createInitialState: createInitialSkipBoState,
  Component: SkipBoGame,
};
