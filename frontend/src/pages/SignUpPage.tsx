import { Link } from 'react-router-dom';

// Placeholder — the real sign-up form lands in P6.
export function SignUpPage() {
  return (
    <main>
      <h1>Create account</h1>
      <p>
        Already registered? <Link to="/signin">Sign in</Link>
      </p>
    </main>
  );
}
