import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigType } from '@nestjs/config';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { API, BODY_LIMIT, ROUTES } from './common/constants';

/**
 * Process-level safety net. A stray rejection must NOT take the server down
 * (hard-exiting on every rejection is an availability footgun, doubly bad on a
 * cold-starting free tier) — log it and keep running. process.exit(1) is
 * reserved for uncaughtException, where state may genuinely be corrupted;
 * `restart: unless-stopped` in compose then brings it back.
 */
function registerProcessHandlers(logger: Logger): void {
  process.on('unhandledRejection', (reason) => {
    logger.error(reason, 'Unhandled promise rejection — continuing');
  });
  process.on('uncaughtException', (error) => {
    logger.fatal(error, 'Uncaught exception — exiting');
    process.exit(1);
  });
}

async function bootstrap() {
  // bufferLogs so early framework logs flow through pino once it's resolved.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  registerProcessHandlers(app.get(Logger));

  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  // Security headers + a bounded JSON body (reject oversized payloads early).
  app.use(helmet());
  app.use(json({ limit: BODY_LIMIT }));
  // Parse cookies so the JWT strategy can read the httpOnly access_token.
  app.use(cookieParser());

  // Trust the reverse proxy (nginx) so req.protocol / req.ip reflect the real
  // client — needed for the Secure cookie behind TLS and the throttler's IP.
  app.set('trust proxy', 1);

  // `/health` stays outside the prefix + version so probes hit a stable path.
  app.setGlobalPrefix(API.PREFIX, {
    exclude: [{ path: ROUTES.HEALTH, method: RequestMethod.GET }],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API.DEFAULT_VERSION,
  });

  // The DTO is the trust boundary: strip unknown props, reject extras, and
  // coerce declared types — but no implicit conversion (keeps NoSQL operator
  // objects from sneaking past a string field).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Close Mongoose cleanly on SIGTERM/SIGINT.
  app.enableShutdownHooks();

  await app.listen(config.port);
}

void bootstrap();
