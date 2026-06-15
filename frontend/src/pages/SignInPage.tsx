import { Link } from 'react-router-dom';

// Placeholder — the real sign-in form lands in P6.
export function SignInPage() {
  return (
    <main>
      <h1>Sign in</h1>
      <p>
        Need an account? <Link to="/signup">Create one</Link>
      </p>
    </main>
  );
}
