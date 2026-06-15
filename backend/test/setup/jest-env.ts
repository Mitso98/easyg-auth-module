/**
 * Runs (via jest `setupFiles`) BEFORE any test module is imported, so the
 * boot-time `ConfigModule` validation has valid env to check. The MONGO_URI here
 * is a placeholder only — integration tests override the DB connection with an
 * in-memory server. The JWT secret is a test value supplied via env (not a
 * hardcoded literal in app code), exercising the real validation path.
 */
process.env.NODE_ENV = 'test';
process.env.MONGO_URI ??= 'mongodb://127.0.0.1:27017/auth-test';
process.env.JWT_SECRET ??= 'test-secret-with-at-least-32-characters!!';
process.env.JWT_EXPIRES_IN ??= '15m';
process.env.LOG_LEVEL = 'silent';
