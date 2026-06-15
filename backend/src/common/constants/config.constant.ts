/** Config namespace tokens (registerAs keys) — referenced via the typed configs. */
export const CONFIG_NAMESPACE = {
  APP: 'app',
  DATABASE: 'database',
  JWT: 'jwt',
} as const;

/** Environment variable names — the one place env keys are spelled out. */
export const ENV_KEYS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  MONGO_URI: 'MONGO_URI',
  JWT_SECRET: 'JWT_SECRET',
  JWT_EXPIRES_IN: 'JWT_EXPIRES_IN',
  CORS_ORIGINS: 'CORS_ORIGINS',
  LOG_LEVEL: 'LOG_LEVEL',
} as const;

export const NODE_ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

/** Minimum JWT secret length (bytes/chars) — enforced at boot, no fallback. */
export const JWT_SECRET_MIN_LENGTH = 32;
