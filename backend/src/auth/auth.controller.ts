import {
  Body,
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
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { appConfig } from '../config/app.config';
import { API, AUTH_THROTTLE, COOKIE, ROUTES } from '../common/constants';
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
@ApiTags('auth')
@Controller({ path: ROUTES.AUTH, version: API.DEFAULT_VERSION })
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
  ) {}

  @Post(ROUTES.SIGN_UP)
  @Throttle({ default: AUTH_THROTTLE })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new account' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({
    description: 'Generic conflict (never confirms the email exists)',
  })
  signUp(@Body() dto: SignUpDto): Promise<UserResponseDto> {
    // A duplicate email throws EmailAlreadyExistsError from the repository; the
    // global exception filter maps it to a generic 409 (EMAIL_TAKEN) — no echo.
    return this.auth.signUp(dto);
  }

  @Post(ROUTES.SIGN_IN)
  @Throttle({ default: AUTH_THROTTLE })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in',
    description:
      'On success sets the httpOnly `access_token` cookie. The JWT is never ' +
      'returned in the body. Unknown email and wrong password return the same 401.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
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
  @ApiOperation({ summary: 'Sign out', description: 'Clears the auth cookie.' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  signOut(@Res({ passthrough: true }) res: Response): { success: true } {
    res.clearCookie(COOKIE.ACCESS_TOKEN, this.cookieOptions());
    return { success: true };
  }

  @Get(ROUTES.ME)
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(COOKIE.ACCESS_TOKEN)
  @ApiOperation({
    summary: 'Current user',
    description: 'Requires the auth cookie.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth cookie' })
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
