import { FormEvent, useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { canUseLocalAuth, signInLocally, signInWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "authenticated" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setMessage("");

    try {
      await signInWithPassword(email, password);
      setStatus("authenticated");
      setMessage("Anmeldung erfolgreich.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.");
    }
  }

  return (
    <section className={styles.page} aria-labelledby="login-title">
      <p className={styles.marker}>00</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 id="login-title">Anmelden</h1>
        <p>Nutze einen vorbereiteten Demo-Account, um Online-Raeume zu erstellen und Einladungen zu oeffnen.</p>
        <label htmlFor="email">E-Mail-Adresse</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label htmlFor="password">Passwort</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit" disabled={!isSupabaseConfigured}>
          Anmelden
        </button>
        {canUseLocalAuth ? (
          <button type="button" onClick={signInLocally}>
            Lokal testen
          </button>
        ) : null}
        {!isSupabaseConfigured ? (
          <p className={styles.error}>
            {canUseLocalAuth
              ? "Lokaler Testmodus ohne Supabase."
              : "Supabase Env Vars fehlen. Login ist lokal deaktiviert."}
          </p>
        ) : null}
        {message ? (
          <p className={status === "error" ? styles.error : styles.success}>{message}</p>
        ) : null}
      </form>
    </section>
  );
}
