import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { appConfig } from '../config/app.config';
import {
  API,
  AUTH_MESSAGES,
  AUTH_THROTTLE,
  COOKIE,
  ROUTES,
} from '../common/constants';
import { EmailAlreadyExistsError } from '../common/errors/email-already-exists.error';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

/**
 * Thin boundary: delegate to the service, set/clear the cookie, map the one
 * known domain error. `@Res({ passthrough: true })` lets us set the cookie while
 * Nest still serializes the returned DTO. The JWT lives ONLY in the cookie — it
 * is never placed in a response body.
 */
@Controller({ path: ROUTES.AUTH, version: API.DEFAULT_VERSION })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  @Post(ROUTES.SIGN_UP)
  @Throttle({ default: AUTH_THROTTLE })
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() dto: SignUpDto): Promise<UserResponseDto> {
    try {
      return await this.auth.signUp(dto);
    } catch (error) {
      if (error instanceof EmailAlreadyExistsError) {
        // Generic — never confirms whether the email already exists.
        throw new ConflictException(AUTH_MESSAGES.EMAIL_TAKEN);
      }
      throw error;
    }
  }

  @Post(ROUTES.SIGN_IN)
  @Throttle({ default: AUTH_THROTTLE })
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserResponseDto> {
    const { user, token } = await this.auth.signIn(dto);
    res.cookie(COOKIE.ACCESS_TOKEN, token, {
      ...this.cookieOptions(),
      maxAge: COOKIE.MAX_AGE_MS,
    });
    return user;
  }

  @Post(ROUTES.SIGN_OUT)
  @HttpCode(HttpStatus.OK)
  signOut(@Res({ passthrough: true }) res: Response): { success: true } {
    res.clearCookie(COOKIE.ACCESS_TOKEN, this.cookieOptions());
    return { success: true };
  }

  @Get(ROUTES.ME)
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: UserResponseDto): UserResponseDto {
    return user;
  }

  /** Cookie flags: JS-unreadable (httpOnly), Secure only in prod (so it still
   *  sets over http://localhost in dev), SameSite=Lax (same-origin → no CSRF). */
  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.app.isProduction,
      sameSite: 'lax',
      path: COOKIE.PATH,
    };
  }
}
