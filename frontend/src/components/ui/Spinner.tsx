import styles from './Spinner.module.css';

/** Accessible loading indicator (used while auth is initializing). */
export function Spinner() {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.srOnly}>Loading…</span>
    </div>
  );
}
