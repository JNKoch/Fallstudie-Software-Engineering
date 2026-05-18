import { Link } from "react-router-dom";

import { AuthProvider, useAuth } from "../auth/AuthContext";
import { LoginPage } from "../pages/LoginPage";
import { AppRouter } from "./router";
import styles from "./App.module.css";

export function App() {
  return (
    <AuthProvider>
      <AuthenticatedShell />
    </AuthProvider>
  );
}

function AuthenticatedShell() {
  const { session, user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.shell}>
        <main className={styles.main}>
          <p className={styles.loading}>Session wird geladen.</p>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.shell}>
        <LoginPage />
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.brand} to="/" aria-label="Zur Startseite">
          Digitale Brettspiele
        </Link>
        <div className={styles.account}>
          <span>{user?.email}</span>
          <button type="button" onClick={() => void signOut()}>
            Abmelden
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <AppRouter />
      </main>
    </div>
  );
}
