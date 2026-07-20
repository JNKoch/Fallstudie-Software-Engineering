import { useState } from "react";

import type { BoardGameModule } from "../types";
import {
  applyTicTacToeMove,
  createInitialTicTacToeState,
  type TicTacToeState,
  type TicTacToeSymbol,
} from "./logic/ticTacToeLogic";
import styles from "./styles/TicTacToe.module.css";

function TicTacToeGame() {
  const [state, setState] = useState(createInitialTicTacToeState);
  const [error, setError] = useState("");

  const statusText =
    state.status === "won"
      ? `${state.winner} hat gewonnen.`
      : state.status === "draw"
        ? "Unentschieden."
        : `${state.currentPlayer} ist am Zug.`;

  function handleMove(cellIndex: number) {
    try {
      setError("");
      setState((currentState) =>
        applyTicTacToeMove(currentState, {
          cellIndex,
          symbol: currentState.currentPlayer,
        }),
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Zug konnte nicht ausgeführt werden.");
    }
  }

  function handleReset() {
    setError("");
    setState(createInitialTicTacToeState());
  }

  return (
    <section className={styles.reference} aria-labelledby="tic-tac-toe-title">
      <h2 id="tic-tac-toe-title">Tic-Tac-Toe</h2>
      <p>Online spielbares Referenzmodul für die Plattformstruktur.</p>
      <p>Lokales Spiel für zwei Spieler auf einem Gerät.</p>
      <p className={styles.status}>{statusText}</p>
      <div className={styles.actions}>
        <button className={styles.resetButton} onClick={handleReset} type="button">
          Neues Spiel
        </button>
      </div>
      <TicTacToeBoard onMove={handleMove} state={state} />
      {error ? <p className={styles.error}>{error}</p> : null}
    </section>
  );
}

export function TicTacToeBoard({
  state,
  playerSymbol,
  onMove,
  disabled = false,
}: {
  state: TicTacToeState;
  playerSymbol?: TicTacToeSymbol;
  onMove?: (cellIndex: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.board} role="grid" aria-label="Tic-Tac-Toe Spielfeld">
      {state.board.map((cell, index) => (
        <button
          aria-label={`Feld ${index + 1}`}
          className={styles.cell}
          disabled={
            disabled ||
            state.status !== "playing" ||
            Boolean(cell) ||
            !onMove ||
            (playerSymbol !== undefined && playerSymbol !== state.currentPlayer)
          }
          key={index}
          onClick={() => onMove?.(index)}
          type="button"
        >
          {cell}
        </button>
      ))}
    </div>
  );
}

export { createInitialTicTacToeState };

export const ticTacToeModule: BoardGameModule = {
  id: "tic-tac-toe",
  title: "Tic-Tac-Toe",
  description: "Klassisches Strategiespiel auf einem 3x3-Feld.",
  playerCount: "2 Spieler",
  difficulty: "easy",
  shortRules: "Abwechselnd setzen. Drei gleiche Zeichen in einer Reihe gewinnen.",
  supportsOnlinePlay: true,
  createInitialState: createInitialTicTacToeState,
  Component: TicTacToeGame,
};
