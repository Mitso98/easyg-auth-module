import { Link, useLocation } from 'react-router-dom';
import { SignInForm } from '../components/sections/SignInForm';
import styles from './AuthPage.module.css';

export function SignInPage() {
  const location = useLocation();
  // Set by the axios 401 interceptor (P7) when an active session expires.
  const expired =
    (location.state as { reason?: string } | null)?.reason === 'expired';

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Sign in</h1>

        {expired ? (
          <p role="status" className={styles.banner}>
            Your session expired — please sign in again.
          </p>
        ) : null}

        <SignInForm />

        <p className={styles.alt}>
          Need an account? <Link to="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}
