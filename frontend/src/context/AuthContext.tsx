import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { User } from '../services/authService';
import type { SignInValues, SignUpValues } from '../schemas/auth.schema';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';

/**
 * Holds the USER (never the token — that's the httpOnly cookie). On mount it
 * hydrates once via GET /me; a 401 there just means "not logged in", not an error.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    authService
      .getMe()
      .then((current) => {
        if (active) setUser(current);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsInitializing(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (values: SignInValues) => {
    setUser(await authService.signIn(values));
  }, []);

  const signUp = useCallback(async (values: SignUpValues) => {
    // Backend signup doesn't set the cookie; sign in right after to establish it.
    await authService.signUp(values);
    setUser(
      await authService.signIn({
        email: values.email,
        password: values.password,
      }),
    );
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    navigate('/signin', { replace: true });
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isInitializing, signIn, signUp, signOut }),
    [user, isInitializing, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
