import { Link } from "react-router-dom";

import styles from "./GamePage.module.css";

export function NotFoundPage() {
  return (
    <section className={styles.page} aria-labelledby="not-found-title">
      <p className={styles.marker}>404</p>
      <div className={styles.content}>
        <h1 id="not-found-title">Seite nicht gefunden</h1>
        <p>Diese Route existiert in der Plattform nicht.</p>
        <Link className={styles.link} to="/">
          Zurück zum Dashboard
        </Link>
      </div>
    </section>
  );
}
