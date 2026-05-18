import type { BoardGameModule } from "../types";
import {
  createInitialTicTacToeState,
  type TicTacToeState,
  type TicTacToeSymbol,
} from "./logic/ticTacToeLogic";
import styles from "./styles/TicTacToe.module.css";

function TicTacToeGame() {
  const state = createInitialTicTacToeState();

  return (
    <section className={styles.reference} aria-labelledby="tic-tac-toe-title">
      <h2 id="tic-tac-toe-title">Tic-Tac-Toe</h2>
      <p>Online spielbares Referenzmodul fuer die Plattformstruktur.</p>
      <TicTacToeBoard state={state} />
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
          disabled={disabled || Boolean(cell) || !onMove || playerSymbol !== state.currentPlayer}
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
