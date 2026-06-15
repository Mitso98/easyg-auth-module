/**
 * The ONLY user shape that crosses the controller boundary. Distinct from the
 * schema and request DTOs — an allow-list of safe fields, so a hash or internal
 * field can never leak by accident.
 */
export class UserResponseDto {
  id: string;
  email: string;
  name: string;

  constructor(partial: Pick<UserResponseDto, 'id' | 'email' | 'name'>) {
    this.id = partial.id;
    this.email = partial.email;
    this.name = partial.name;
  }
}
