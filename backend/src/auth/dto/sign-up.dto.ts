import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_RULES, VALIDATION } from '../../common/constants';

/** Normalize string inputs at the trust boundary; non-strings pass through so
 *  @IsString/@IsEmail can reject them (e.g. a `{ "$gt": "" }` operator object). */
const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;
const trimLower = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/**
 * Signup request contract — the trust boundary. @IsString/@IsEmail coerce the
 * NoSQL-injection vector away (an operator object is not a string); the password
 * policy (min 8, ≤128, ≥1 letter/number/special) is enforced here and mirrored
 * verbatim by the frontend zod schema. Email is normalized so the unique index
 * sees one canonical form.
 */
export class SignUpDto {
  @Transform(trimLower)
  @IsEmail({}, { message: 'A valid email is required' })
  @MaxLength(VALIDATION.EMAIL.MAX)
  email: string;

  @Transform(trim)
  @IsString()
  @MinLength(VALIDATION.NAME.MIN)
  @MaxLength(VALIDATION.NAME.MAX)
  name: string;

  @IsString()
  @MinLength(VALIDATION.PASSWORD.MIN)
  @MaxLength(VALIDATION.PASSWORD.MAX)
  @Matches(PASSWORD_RULES.LETTER, {
    message: 'Password must contain at least one letter',
  })
  @Matches(PASSWORD_RULES.NUMBER, {
    message: 'Password must contain at least one number',
  })
  @Matches(PASSWORD_RULES.SPECIAL, {
    message: 'Password must contain at least one special character',
  })
  password: string;
}
