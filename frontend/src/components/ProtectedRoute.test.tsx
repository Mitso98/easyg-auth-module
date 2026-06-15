import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Unauthenticated: getMe rejects, so hydration resolves with no user.
vi.mock('../services/authService', () => ({
  authService: {
    getMe: vi.fn().mockRejectedValue(new Error('unauthenticated')),
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
}));

import { RootLayout } from './layouts/RootLayout';
import { ProtectedRoute } from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects an unauthenticated visit to /app over to /signin', async () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<div>Secret content</div>} />
            </Route>
            <Route path="/signin" element={<div>Sign in page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    // Once hydration resolves with no user, we land on /signin.
    expect(await screen.findByText('Sign in page')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });
});
