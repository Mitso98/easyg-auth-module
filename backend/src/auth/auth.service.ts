import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { AUTH_MESSAGES } from '../common/constants';
import { PasswordHasher } from '../common/security/password-hasher';
import { UsersRepository } from '../users/users.repository';
import { UserDocument } from '../users/schemas/user.schema';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

/**
 * HTTP-agnostic auth use-cases. Signs and returns the JWT as a string; it never
 * touches the response (the controller sets the cookie). All crypto goes through
 * the injected PasswordHasher — the controller never sees raw argon2.
 */
@Injectable()
export class AuthService implements OnModuleInit {
  /** Precomputed at boot via the REAL hasher so the unknown-email path performs
   *  the same argon2 work as a genuine verify (timing-uniform signin). */
  private dummyPasswordHash!: string;

  constructor(
    private readonly users: UsersRepository,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.dummyPasswordHash = await this.hasher.hash(
      randomBytes(32).toString('hex'),
    );
  }

  /** Hash happens in the service (not a pre-save hook). Duplicate emails surface
   *  as EmailAlreadyExistsError from the repo — mapped to a generic 409 above. */
  async signUp(dto: SignUpDto): Promise<UserResponseDto> {
    const passwordHash = await this.hasher.hash(dto.password);
    const user = await this.users.createUser({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });
    return this.toResponse(user);
  }

  async signIn(
    dto: SignInDto,
  ): Promise<{ user: UserResponseDto; token: string }> {
    const user = await this.users.findByEmail(dto.email);
    // Always run a verify — real hash if the user exists, dummy hash if not — so
    // response time can't reveal whether the account exists.
    const passwordMatches = await this.hasher.verify(
      user?.passwordHash ?? this.dummyPasswordHash,
      dto.password,
    );
    // Unknown email and wrong password throw the SAME error (anti-enumeration).
    if (!user || !passwordMatches) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    const token = await this.signToken(user);
    return { user: this.toResponse(user), token };
  }

  private signToken(user: UserDocument): Promise<string> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.signAsync(payload);
  }

  private toResponse(user: UserDocument): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  }
}
