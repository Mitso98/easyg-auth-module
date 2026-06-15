/**
 * Single source of truth for input-size limits and the password policy.
 * The schema (storage layer) and DTOs (trust boundary) both reference these,
 * so the two enforcement layers can never silently disagree. The frontend zod
 * schema mirrors the password policy verbatim (client validation is UX only).
 */
export const VALIDATION = {
  NAME: { MIN: 3, MAX: 100 },
  // Password capped at 128: an unbounded password is an argon2 memory-DoS vector.
  PASSWORD: { MIN: 8, MAX: 128 },
  EMAIL: { MAX: 254 },
} as const;

/**
 * Password complexity rules. Each entry is one rule the policy enforces; the
 * DTO applies them with @Matches and the frontend re-states them in zod.
 */
export const PASSWORD_RULES = {
  LETTER: /[A-Za-z]/,
  NUMBER: /\d/,
  SPECIAL: /[^A-Za-z0-9]/,
} as const;

/** Bound the raw JSON body so a giant payload can't exhaust memory before DTO checks. */
export const BODY_LIMIT = '16kb';
