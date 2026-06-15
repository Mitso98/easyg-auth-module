import { registerAs, ConfigType } from '@nestjs/config';
import { CONFIG_NAMESPACE } from '../common/constants';

/**
 * Database config. The URI carries credentials, so it is read here once and
 * never logged (a connection error must not serialize this value).
 */
export const databaseConfig = registerAs(CONFIG_NAMESPACE.DATABASE, () => ({
  uri: process.env.MONGO_URI as string,
}));

export type DatabaseConfig = ConfigType<typeof databaseConfig>;
