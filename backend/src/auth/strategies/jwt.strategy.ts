import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../config/jwt.config';
import { COOKIE, JWT_ALGORITHM } from '../../common/constants';
import { UsersRepository } from '../../users/users.repository';
import { UserResponseDto } from '../dto/user-response.dto';

export interface JwtPayload {
  sub: string;
  email: string;
}

/** Read the JWT from the httpOnly cookie — NOT the Authorization header. */
const cookieExtractor = (req: Request): string | null => {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[COOKIE.ACCESS_TOKEN] ?? null;
};

/**
 * Validates the cookie JWT and resolves the current user via the lean repo read.
 * The returned DTO becomes `req.user`; expiry is enforced (15m access token).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY) jwtCfg: ConfigType<typeof jwtConfig>,
    private readonly users: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: jwtCfg.secret,
      ignoreExpiration: false,
      algorithms: [JWT_ALGORITHM],
    });
  }

  async validate(payload: JwtPayload): Promise<UserResponseDto> {
    const user = await this.users.findByIdLean(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return new UserResponseDto({
      id: String(user._id),
      email: user.email,
      name: user.name,
    });
  }
}
