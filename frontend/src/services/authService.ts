import { api } from './http';
import type { SignInValues, SignUpValues } from '../schemas/auth.schema';

/** The authenticated user shape (matches the backend UserResponseDto). */
export interface User {
  id: string;
  email: string;
  name: string;
}

/**
 * The ONLY caller of the axios instance for auth. The JWT lives in the httpOnly
 * cookie — no token is ever read from or written to these responses.
 */
export const authService = {
  async signUp(values: SignUpValues): Promise<User> {
    // confirmPassword is client-only — never sent (and the backend would reject it).
    const { data } = await api.post<User>('/auth/signup', {
      email: values.email,
      name: values.name,
      password: values.password,
    });
    return data;
  },

  async signIn(values: SignInValues): Promise<User> {
    const { data } = await api.post<User>('/auth/signin', values);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  async signOut(): Promise<void> {
    await api.post('/auth/signout');
  },
};
