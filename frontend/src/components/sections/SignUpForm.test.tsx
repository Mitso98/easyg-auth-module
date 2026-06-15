import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock the service so AuthProvider hydration + actions never hit the network.
vi.mock('../../services/authService', () => ({
  authService: {
    getMe: vi.fn().mockRejectedValue(new Error('unauthenticated')),
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  },
}));

import { AuthProvider } from '../../context/AuthContext';
import { SignUpForm } from './SignUpForm';

function renderForm() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <SignUpForm />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('SignUpForm', () => {
  it('shows the password policy error and blocks submit for a weak password', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Password'), 'abc');

    // Inline, field-level policy error (role="alert" from FormField).
    expect(
      await screen.findByText(/at least 8 characters/i),
    ).toBeInTheDocument();

    // Submit stays disabled while the form is invalid.
    expect(
      screen.getByRole('button', { name: /create account/i }),
    ).toBeDisabled();
  });
});
