import { z } from 'zod';

/**
 * Password policy mirrored VERBATIM from the backend (min 8, max 128, ≥1 letter,
 * ≥1 number, ≥1 special). Client validation is UX only — the server is
 * authoritative. Keep these in lockstep with backend `VALIDATION`/`PASSWORD_RULES`.
 */
const NAME = { MIN: 3, MAX: 100 } as const;
const PASSWORD = { MIN: 8, MAX: 128 } as const;

const passwordField = z
  .string()
  .min(PASSWORD.MIN, `Password must be at least ${PASSWORD.MIN} characters`)
  .max(PASSWORD.MAX, `Password must be at most ${PASSWORD.MAX} characters`)
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const signInSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z
  .object({
    email: z.email('Enter a valid email address'),
    name: z
      .string()
      .min(NAME.MIN, `Name must be at least ${NAME.MIN} characters`)
      .max(NAME.MAX, `Name must be at most ${NAME.MAX} characters`),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
