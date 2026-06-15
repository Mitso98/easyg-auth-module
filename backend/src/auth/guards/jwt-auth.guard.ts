import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guards routes behind the cookie JWT strategy. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
