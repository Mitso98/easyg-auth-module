import { registerAs, ConfigType } from '@nestjs/config';
import { CONFIG_NAMESPACE, NODE_ENV } from '../common/constants';

/**
 * Typed application config. Consumers inject `appConfig.KEY` and read fields off
 * a typed object instead of doing scattered `configService.get('STRING')` lookups.
 */
export const appConfig = registerAs(CONFIG_NAMESPACE.APP, () => {
  const nodeEnv = process.env.NODE_ENV ?? NODE_ENV.DEVELOPMENT;
  return {
    nodeEnv,
    isProduction: nodeEnv === NODE_ENV.PRODUCTION,
    port: parseInt(process.env.PORT ?? '3000', 10),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    // Empty in the same-origin topology; only used if CORS is enabled for a split dev setup.
    corsOrigins: (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
});

export type AppConfig = ConfigType<typeof appConfig>;
