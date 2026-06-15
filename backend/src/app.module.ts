import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { stdSerializers } from 'pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { envValidationSchema } from './config/env.validation';
import { NODE_ENV, ROUTES } from './common/constants';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

// Default rate limit (per IP) — the auth routes tighten this further.
const DEFAULT_THROTTLE = { ttl: 60_000, limit: 100 };

/**
 * Pretty logs are a dev convenience. `pino-pretty` is a devDependency, so it is
 * absent from the production image (`npm ci --omit=dev`). Resolve it defensively
 * so a dev-mode container (or any environment without the dep) degrades to
 * structured JSON instead of crashing at boot when pino's worker can't load the
 * transport target.
 */
function prettyLogTransport(
  nodeEnv: string,
): { target: string; options: Record<string, unknown> } | undefined {
  if (nodeEnv !== NODE_ENV.DEVELOPMENT) return undefined;
  try {
    require.resolve('pino-pretty');
    return { target: 'pino-pretty', options: { singleLine: true } };
  } catch {
    return undefined;
  }
}

// A driver/connection error can embed the MONGO_URI (with credentials) in its
// message or stack. Strip any connection string before it is serialized so the
// "never log the MONGO_URI" rule also holds on the error-logging path (the
// exception filter logs `{ err }` on unexpected 5xx).
const CONNECTION_STRING = /mongodb(\+srv)?:\/\/\S+/gi;
const scrubConnectionString = (text: string): string =>
  text.replace(CONNECTION_STRING, 'mongodb://[REDACTED]');

const errSerializer = (error: unknown) => {
  const serialized = stdSerializers.err(error as Error);
  if (typeof serialized.message === 'string') {
    serialized.message = scrubConnectionString(serialized.message);
  }
  if (typeof serialized.stack === 'string') {
    serialized.stack = scrubConnectionString(serialized.stack);
  }
  return serialized;
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, jwtConfig],
      // Fail-fast: invalid/missing env aborts boot, reporting every problem at once.
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    // Structured JSON logging (pino over winston). One correlation id threads the
    // logs, the error envelope, and the response header for one-line triage.
    LoggerModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (app: ConfigType<typeof appConfig>) => ({
        pinoHttp: {
          level: app.logLevel,
          // Reuse an inbound x-request-id or mint one; echo it back as a header.
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const incoming = req.headers['x-request-id'];
            const id =
              (typeof incoming === 'string' && incoming) || randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          customLogLevel: (_req, res, err) => {
            if (res.statusCode >= 500 || err) return 'error';
            if (res.statusCode >= 400) return 'warn';
            return 'info';
          },
          // Don't spam the logs with health-probe traffic.
          autoLogging: { ignore: (req) => req.url === `/${ROUTES.HEALTH}` },
          // Scrub a MONGO_URI (with credentials) out of any logged error.
          serializers: { err: errSerializer },
          // Never let a credential, cookie, or token reach the logs.
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
              'req.body.confirmPassword',
              'req.body.token',
              '*.password',
              '*.confirmPassword',
              '*.token',
            ],
            censor: '[REDACTED]',
          },
          // Pretty logs only in dev *and only if pino-pretty resolves*; prod and
          // test (and a dev-mode prod image) emit plain JSON. See prettyLogTransport.
          transport: prettyLogTransport(app.nodeEnv),
        },
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [databaseConfig.KEY, appConfig.KEY],
      useFactory: (
        db: ConfigType<typeof databaseConfig>,
        app: ConfigType<typeof appConfig>,
      ) => ({
        uri: db.uri,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        // Build indexes automatically only in dev; in prod they are created
        // explicitly (the repository calls ensureIndexes on boot).
        autoIndex: app.nodeEnv === NODE_ENV.DEVELOPMENT,
      }),
    }),
    // In-memory throttler: per-instance, resets on restart. Fine for a single
    // demo instance; production would use a shared store (Redis). The real client
    // IP is resolved via Express `trust proxy` (set in main.ts).
    ThrottlerModule.forRoot([DEFAULT_THROTTLE]),
    UsersModule,
    AuthModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Global via APP_FILTER so it can inject the pino logger.
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
