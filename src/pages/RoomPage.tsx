import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { getGameById } from "../games/gameRegistry";
import { TicTacToeBoard } from "../games/tic-tac-toe";
import type { TicTacToeState } from "../games/tic-tac-toe/logic/ticTacToeLogic";
import { createAuthedMultiplayerService, type GameRoom } from "../services/multiplayerService";
import styles from "./RoomPage.module.css";

export function RoomPage() {
  const { gameId, roomId } = useParams();
  const { user } = useAuth();
  const game = gameId ? getGameById(gameId) : undefined;
  const service = useMemo(() => createAuthedMultiplayerService(user?.id ?? null), [user?.id]);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [moveError, setMoveError] = useState("");
  const [restartError, setRestartError] = useState("");
  const [isRestarting, setIsRestarting] = useState(false);

  const loadRoom = useCallback(async () => {
    if (!roomId) {
      return;
    }

    try {
      const nextRoom = await service.loadRoom(roomId);
      setRoom(nextRoom);
      setLoadError("");
    } catch (nextError) {
      setRoom(null);
      setLoadError(nextError instanceof Error ? nextError.message : "Raum konnte nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }, [roomId, service]);

  useEffect(() => {
    void loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const subscription = service.subscribeToRoom(roomId, () => {
      void loadRoom();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadRoom, roomId, service]);

  const currentPlayer = room?.room_players?.find((player) => player.user_id === user?.id);
  const playerSymbol = currentPlayer?.symbol;
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;

  async function handleJoin() {
    if (!roomId || !room) {
      return;
    }

    setError("");

    try {
      await service.joinRoom(roomId);
      await loadRoom();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Raum konnte nicht betreten werden.");
    }
  }

  async function handleMove(cellIndex: number) {
    if (!room || !playerSymbol) {
      return;
    }

    setMoveError("");

    try {
      const nextRoom = await service.submitMove({
        room,
        playerSymbol,
        movePayload: { cellIndex, symbol: playerSymbol },
      });
      setRoom(nextRoom);
    } catch (nextError) {
      setMoveError(nextError instanceof Error ? nextError.message : "Zug wurde abgelehnt.");
    }
  }

  async function handleRestart() {
    if (!room || !playerSymbol) {
      return;
    }

    setRestartError("");
    setIsRestarting(true);

    try {
      const nextRoom = await service.restartRoom(room);
      setRoom(nextRoom);
      setMoveError("");
    } catch (nextError) {
      setRestartError(nextError instanceof Error ? nextError.message : "Neue Runde konnte nicht gestartet werden.");
    } finally {
      setIsRestarting(false);
    }
  }

  if (!game) {
    return (
      <section className={styles.page} aria-labelledby="missing-game-title">
        <p className={styles.marker}>404</p>
        <div className={styles.content}>
          <h1 id="missing-game-title">Spiel nicht gefunden</h1>
          <Link className={styles.link} to="/">
            Zurück zum Dashboard
          </Link>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className={styles.page} aria-labelledby="room-loading-title">
        <p className={styles.marker}>03</p>
        <div className={styles.content}>
          <h1 id="room-loading-title">Raum wird geladen</h1>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className={styles.page} aria-labelledby="room-load-error-title">
        <p className={styles.marker}>404</p>
        <div className={styles.content}>
          <h1 id="room-load-error-title">Raum konnte nicht geladen werden</h1>
          <p>{loadError}</p>
          <Link className={styles.link} to={`/games/${game.id}`}>
            Zurück zum Spiel
          </Link>
        </div>
      </section>
    );
  }

  if (!room) {
    return (
      <section className={styles.page} aria-labelledby="missing-room-title">
        <p className={styles.marker}>404</p>
        <div className={styles.content}>
          <h1 id="missing-room-title">Raum nicht gefunden</h1>
          <p>Der Einladungslink ist ungültig oder der Raum wurde gelöscht.</p>
          <Link className={styles.link} to={`/games/${game.id}`}>
            Zurück zum Spiel
          </Link>
        </div>
      </section>
    );
  }

  const state = room.state as TicTacToeState;
  const statusText =
    state.status === "won"
      ? `${state.winner} hat gewonnen.`
      : state.status === "draw"
        ? "Unentschieden."
        : `${state.currentPlayer} ist am Zug.`;

  return (
    <section className={styles.page} aria-labelledby="room-title">
      <p className={styles.marker}>03</p>
      <div className={styles.content}>
        <Link className={styles.link} to={`/games/${game.id}`}>
          Zurück zum Spiel
        </Link>
        <h1 id="room-title">{game.title}</h1>
        <div className={styles.roomGrid}>
          <div className={styles.panel}>
            <h2>Status</h2>
            <p>{statusText}</p>
            {playerSymbol ? (
              <>
                <p>Du spielst {playerSymbol}.</p>
                <button type="button" onClick={() => void handleRestart()} disabled={isRestarting}>
                  {isRestarting ? "Neue Runde startet" : "Neue Runde"}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => void handleJoin()}>
                Raum beitreten
              </button>
            )}
            {error ? <p className={styles.error}>{error}</p> : null}
            {restartError ? <p className={styles.error}>{restartError}</p> : null}
          </div>
          <div className={styles.panel}>
            <h2>Einladung</h2>
            <p>{shareUrl}</p>
          </div>
          <div className={styles.panel}>
            <h2>Spieler</h2>
            <ol>
              {room.room_players?.map((player) => (
                <li key={player.user_id}>
                  {player.symbol}: {player.user_id === user?.id ? "Du" : "Mitspieler"}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className={styles.boardPanel}>
          <TicTacToeBoard
            disabled={state.status !== "playing"}
            onMove={(cellIndex) => void handleMove(cellIndex)}
            playerSymbol={playerSymbol}
            state={state}
          />
          {moveError ? <p className={styles.error}>{moveError}</p> : null}
        </div>
      </div>
    </section>
  );
}
