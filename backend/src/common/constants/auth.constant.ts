import type { Algorithm } from '@node-rs/argon2';

// Argon2id (=2). Referenced as a literal because the package ships `Algorithm`
// as an ambient const enum, which `isolatedModules` forbids accessing by name.
const ARGON2ID = 2 as Algorithm;

/**
 * Single, auditable home for the anti-enumeration wording. EVERY signin failure
 * (unknown email OR wrong password) returns INVALID_CREDENTIALS; signup never
 * confirms an email exists (EMAIL_TAKEN is deliberately generic — it does not
 * echo the address).
 */
export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_TAKEN: 'Unable to create an account with the provided details',
} as const;

/** httpOnly auth cookie. maxAge mirrors the 15m access-token lifetime. */
export const COOKIE = {
  ACCESS_TOKEN: 'access_token',
  MAX_AGE_MS: 15 * 60 * 1000,
  PATH: '/',
} as const;

/** OWASP argon2id parameters. Centralized so real hashes and the timing-uniform
 *  dummy hash are produced with identical cost. */
export const ARGON2_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export const JWT_ALGORITHM = 'HS256' as const;
