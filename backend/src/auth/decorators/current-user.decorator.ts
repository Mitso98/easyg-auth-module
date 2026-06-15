import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserResponseDto } from '../dto/user-response.dto';

/**
 * Pulls the authenticated user (set by JwtStrategy.validate) off the request.
 * Use ONLY on routes guarded by JwtAuthGuard — the guard guarantees `req.user`
 * is set (the strategy throws otherwise), so the non-optional return type holds.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserResponseDto => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: UserResponseDto }>();
    return req.user as UserResponseDto;
  },
);
