import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConfig } from '../config/jwt.config';
import { JWT_ALGORITHM } from '../common/constants';
import {
  Argon2PasswordHasher,
  PasswordHasher,
} from '../common/security/password-hasher';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [jwtConfig.KEY],
      useFactory: (cfg: ConfigType<typeof jwtConfig>) => ({
        secret: cfg.secret,
        signOptions: {
          // Config value is a string ('15m'); jsonwebtoken's types want its
          // branded StringValue union, so assert to the expected option type.
          expiresIn: cfg.expiresIn as JwtSignOptions['expiresIn'],
          algorithm: JWT_ALGORITHM,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Depend on the abstraction; bind the argon2 implementation here.
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
  ],
})
export class AuthModule {}
