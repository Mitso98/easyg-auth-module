import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import { API, BODY_LIMIT, ROUTES } from './common/constants';

/**
 * Shared HTTP-layer configuration applied identically in production (main.ts)
 * and in integration tests, so tests exercise the SAME request pipeline:
 * security headers, bounded body, cookie parsing, global prefix + URI versioning
 * (with /health excluded), and the trust-boundary ValidationPipe.
 */
export function configureApp(app: INestApplication): void {
  app.use(helmet());
  app.use(json({ limit: BODY_LIMIT }));
  app.use(cookieParser());

  app.setGlobalPrefix(API.PREFIX, {
    exclude: [{ path: ROUTES.HEALTH, method: RequestMethod.GET }],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API.DEFAULT_VERSION,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
}
