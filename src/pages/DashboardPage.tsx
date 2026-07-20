import { Link } from "react-router-dom";

import { gameRegistry } from "../games/gameRegistry";
import type { GameDifficulty } from "../games/types";
import styles from "./DashboardPage.module.css";

const difficultyLabels: Record<GameDifficulty, string> = {
  easy: "Einfach",
  medium: "Mittel",
  hard: "Schwer",
};

export function DashboardPage() {
  return (
    <section className={styles.page} aria-labelledby="dashboard-title">
      <div className={styles.intro}>
        <p className={styles.marker}>01</p>
        <div>
          <h1 id="dashboard-title">Digitale Brettspiele</h1>
          <p>Dashboard für Online-Brettspiele mit Freunden.</p>
        </div>
      </div>

      <div className={styles.grid} aria-label="Verfügbare Spiele">
        {gameRegistry.map((game) => (
          <article className={styles.card} key={game.id}>
            <div className={styles.cardHeader}>
              <h2>{game.title}</h2>
              <span>{difficultyLabels[game.difficulty]}</span>
            </div>
            <p>{game.description}</p>
            <dl className={styles.meta}>
              <div>
                <dt>Spieler</dt>
                <dd>{game.playerCount}</dd>
              </div>
              <div>
                <dt>Regeln</dt>
                <dd>{game.shortRules}</dd>
              </div>
            </dl>
            <div className={styles.actions}>
              <Link className={styles.link} to={`/games/${game.id}`}>
                {game.title} öffnen
              </Link>
              {game.supportsOnlinePlay ? (
                <Link className={styles.link} to={`/games/${game.id}`}>
                  Online spielen
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
