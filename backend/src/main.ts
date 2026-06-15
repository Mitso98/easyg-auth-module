import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigType } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { configureApp } from './app.setup';
import { setupSwagger } from './swagger';

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

  // Trust the reverse proxy (nginx) so req.protocol / req.ip reflect the real
  // client — needed for the Secure cookie behind TLS and the throttler's IP.
  app.set('trust proxy', 1);

  // Shared HTTP pipeline (helmet, body limit, cookies, prefix, versioning,
  // ValidationPipe) — identical to what the integration tests apply.
  configureApp(app);

  // Swagger UI at /docs + raw spec at /docs-json.
  setupSwagger(app);

  // Close Mongoose cleanly on SIGTERM/SIGINT.
  app.enableShutdownHooks();

  await app.listen(config.port);
}

void bootstrap();
