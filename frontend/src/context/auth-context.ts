import { createContext } from 'react';
import type { User } from '../services/authService';
import type { SignInValues, SignUpValues } from '../schemas/auth.schema';

export interface AuthContextValue {
  user: User | null;
  /** True until the initial cookie-based hydration (GET /me) resolves. */
  isInitializing: boolean;
  signIn: (values: SignInValues) => Promise<void>;
  signUp: (values: SignUpValues) => Promise<void>;
  signOut: () => Promise<void>;
}

// Kept in its own (component-free) module so React Fast Refresh stays happy.
export const AuthContext = createContext<AuthContextValue | null>(null);
