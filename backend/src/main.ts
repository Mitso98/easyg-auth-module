import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigType } from '@nestjs/config';
import { RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { json } from 'express';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { API, BODY_LIMIT, ROUTES } from './common/constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);

  // Security headers + a bounded JSON body (reject oversized payloads early).
  app.use(helmet());
  app.use(json({ limit: BODY_LIMIT }));

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
