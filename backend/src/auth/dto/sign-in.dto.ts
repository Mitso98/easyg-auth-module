import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import { VALIDATION } from '../../common/constants';

const trimLower = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/**
 * Signin request contract. Deliberately does NOT re-assert the full password
 * policy — it only coerces both fields to strings (blocking operator injection)
 * and caps the password length (argon2 memory-DoS guard). Validity is decided by
 * the stored hash, not by the shape of the submitted password.
 */
export class SignInDto {
  @ApiProperty({ example: 'ada@example.com' })
  @Transform(trimLower)
  @IsEmail({}, { message: 'A valid email is required' })
  email: string;

  @ApiProperty({ example: 'Sup3r$ecret', maxLength: VALIDATION.PASSWORD.MAX })
  @IsString()
  @MaxLength(VALIDATION.PASSWORD.MAX)
  password: string;
}
