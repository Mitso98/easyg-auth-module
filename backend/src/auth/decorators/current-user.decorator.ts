import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserResponseDto } from '../dto/user-response.dto';

/** Pulls the authenticated user (set by JwtStrategy.validate) off the request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserResponseDto | undefined => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: UserResponseDto }>();
    return req.user;
  },
);
