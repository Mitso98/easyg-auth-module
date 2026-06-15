import * as Joi from 'joi';
import { JWT_SECRET_MIN_LENGTH, NODE_ENV } from '../common/constants';

/**
 * Boot-time env validation. The app refuses to start on missing/invalid config
 * (fail-fast) so a misconfigured deploy fails loudly at startup, not on the
 * first request. `MONGO_URI` is matched by scheme rather than Joi.uri() so valid
 * Atlas SRV strings (which carry query options) are not rejected.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid(NODE_ENV.DEVELOPMENT, NODE_ENV.PRODUCTION, NODE_ENV.TEST)
    .default(NODE_ENV.DEVELOPMENT),
  PORT: Joi.number().port().default(3000),
  MONGO_URI: Joi.string()
    .pattern(/^mongodb(\+srv)?:\/\/.+/)
    .required()
    .messages({
      'string.pattern.base':
        'MONGO_URI must be a mongodb:// or mongodb+srv:// connection string',
    }),
  JWT_SECRET: Joi.string().min(JWT_SECRET_MIN_LENGTH).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  CORS_ORIGINS: Joi.string().allow('').default(''),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('info'),
});
