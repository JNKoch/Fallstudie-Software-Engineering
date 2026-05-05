import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { getGameById } from "../games/gameRegistry";
import { createAuthedMultiplayerService } from "../services/multiplayerService";
import styles from "./GamePage.module.css";

export function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const game = gameId ? getGameById(gameId) : undefined;
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!game) {
    return (
      <section className={styles.page} aria-labelledby="missing-game-title">
        <p className={styles.marker}>404</p>
        <div className={styles.content}>
          <h1 id="missing-game-title">Spiel nicht gefunden</h1>
          <p>Das angeforderte Spiel ist nicht in der Registry eingetragen.</p>
          <Link className={styles.link} to="/">
            Zurueck zum Dashboard
          </Link>
        </div>
      </section>
    );
  }

  const GameComponent = game.Component;

  async function handleCreateRoom() {
    if (!game?.createInitialState) {
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const service = createAuthedMultiplayerService(user?.id ?? null);
      const room = await service.createRoom(game.id, game.createInitialState());
      navigate(`/games/${game.id}/rooms/${room.id}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Raum konnte nicht erstellt werden.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className={styles.page} aria-labelledby="game-title">
      <p className={styles.marker}>02</p>
      <div className={styles.content}>
        <Link className={styles.link} to="/">
          Zurueck zum Dashboard
        </Link>
        <h1 id="game-title">{game.title}</h1>
        <p>{game.description}</p>
        {game.supportsOnlinePlay ? (
          <div className={styles.onlinePanel}>
            <h2>Online spielen</h2>
            <p>Erstelle einen Raum und teile den Einladungslink mit einer zweiten Person.</p>
            <button type="button" onClick={() => void handleCreateRoom()} disabled={isCreating}>
              {isCreating ? "Raum wird erstellt" : "Raum erstellen"}
            </button>
            {error ? <p className={styles.error}>{error}</p> : null}
          </div>
        ) : null}
        <div className={styles.module}>
          <GameComponent />
        </div>
      </div>
    </section>
  );
}
