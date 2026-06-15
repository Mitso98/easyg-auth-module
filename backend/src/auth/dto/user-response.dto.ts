import { ApiProperty } from '@nestjs/swagger';

/**
 * The ONLY user shape that crosses the controller boundary. Distinct from the
 * schema and request DTOs — an allow-list of safe fields, so a hash or internal
 * field can never leak by accident.
 */
export class UserResponseDto {
  @ApiProperty({ example: '665f1b2c3d4e5f6a7b8c9d0e' })
  id: string;

  @ApiProperty({ example: 'ada@example.com' })
  email: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  name: string;

  constructor(partial: Pick<UserResponseDto, 'id' | 'email' | 'name'>) {
    this.id = partial.id;
    this.email = partial.email;
    this.name = partial.name;
  }
}
