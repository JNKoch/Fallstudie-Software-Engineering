import { useState } from "react";

import type { BoardGameModule } from "../types";
import {
  applyConnectFourMove,
  CONNECT_FOUR_COLUMNS,
  getConnectFourPlayerLabel,
  isConnectFourColumnFull,
  createInitialConnectFourState,
  type ConnectFourPlayer,
  type ConnectFourState,
} from "./logic/connectFourLogic";
import styles from "./styles/ConnectFour.module.css";

function ConnectFourGame() {
  const [state, setState] = useState(createInitialConnectFourState);
  const [error, setError] = useState("");

  const statusText =
    state.status === "won"
      ? `${getConnectFourPlayerLabel(state.winner ?? state.currentPlayer)} hat gewonnen.`
      : state.status === "draw"
        ? "Unentschieden."
        : `${getConnectFourPlayerLabel(state.currentPlayer)} ist am Zug.`;

  function handleMove(columnIndex: number) {
    try {
      setError("");
      setState((currentState) =>
        applyConnectFourMove(currentState, {
          columnIndex,
          player: currentState.currentPlayer,
        }),
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Zug konnte nicht ausgefuehrt werden.");
    }
  }

  function handleReset() {
    setError("");
    setState(createInitialConnectFourState());
  }

  return (
    <section className={styles.reference} aria-labelledby="connect-four-title">
      <h2 id="connect-four-title">4 Gewinnt</h2>
      <p>Lokales Spiel fuer zwei Spieler auf einem Geraet.</p>
      <p>Wirf abwechselnd Spielsteine in die Spalten. Vier gleiche Farben in einer Reihe gewinnen.</p>
      <p className={styles.status}>{statusText}</p>
      <div className={styles.actions}>
        <button className={styles.resetButton} onClick={handleReset} type="button">
          Neues Spiel
        </button>
      </div>
      <ConnectFourBoard onMove={handleMove} state={state} />
      {error ? <p className={styles.error}>{error}</p> : null}
    </section>
  );
}

export function ConnectFourBoard({
  state,
  playerSymbol,
  onMove,
  disabled = false,
}: {
  state: ConnectFourState;
  playerSymbol?: ConnectFourPlayer;
  onMove?: (columnIndex: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.boardArea}>
      <div className={styles.board} role="grid" aria-label="4 Gewinnt Spielfeld">
        {state.board.map((cell, index) => {
          const rowIndex = Math.floor(index / CONNECT_FOUR_COLUMNS);
          const columnIndex = index % CONNECT_FOUR_COLUMNS;
          const label = cell ? getConnectFourPlayerLabel(cell) : "leer";

          return (
            <div
              aria-label={`Reihe ${rowIndex + 1}, Spalte ${columnIndex + 1}: ${label}`}
              className={styles.cell}
              key={index}
              role="gridcell"
            >
              <span
                aria-hidden="true"
                className={`${styles.disc} ${cell === "red" ? styles.red : cell === "yellow" ? styles.yellow : styles.empty}`}
              />
            </div>
          );
        })}
      </div>
      <div className={styles.dropControls} aria-label="Spaltenauswahl">
        {Array.from({ length: CONNECT_FOUR_COLUMNS }, (_, columnIndex) => (
          <button
            aria-label={`Stein in Spalte ${columnIndex + 1} werfen`}
            className={styles.dropButton}
            disabled={
              disabled ||
              state.status !== "playing" ||
              !onMove ||
              isConnectFourColumnFull(state, columnIndex) ||
              (playerSymbol !== undefined && playerSymbol !== state.currentPlayer)
            }
            key={columnIndex}
            onClick={() => onMove?.(columnIndex)}
            type="button"
          >
            {columnIndex + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export { createInitialConnectFourState };

export const connectFourModule: BoardGameModule = {
  id: "connect-four",
  title: "4 Gewinnt",
  description: "Klassisches Strategiespiel mit Fallsteinen auf einem 7x6-Raster.",
  playerCount: "2 Spieler",
  difficulty: "medium",
  shortRules: "Abwechselnd in Spalten werfen. Vier gleiche Farben waagrecht, senkrecht oder diagonal gewinnen.",
  supportsOnlinePlay: false,
  createInitialState: createInitialConnectFourState,
  Component: ConnectFourGame,
};
