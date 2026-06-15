import { Link } from 'react-router-dom';
import { SignUpForm } from '../components/sections/SignUpForm';
import styles from './AuthPage.module.css';

export function SignUpPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Create account</h1>

        <SignUpForm />

        <p className={styles.alt}>
          Already registered? <Link to="/signin">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
