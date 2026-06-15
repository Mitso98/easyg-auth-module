import { registerAs, ConfigType } from '@nestjs/config';
import { CONFIG_NAMESPACE } from '../common/constants';

/** Typed JWT config — secret is boot-validated (>=32 chars, no hardcoded fallback). */
export const jwtConfig = registerAs(CONFIG_NAMESPACE.JWT, () => ({
  secret: process.env.JWT_SECRET as string,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
}));

export type JwtConfig = ConfigType<typeof jwtConfig>;
