/**
 * Domain error raised by the repository when the unique-email index rejects a
 * duplicate insert (Mongo 11000). Keeping it framework-agnostic lets the service
 * stay HTTP-unaware; the controller/filter maps it to a generic 409 at the
 * boundary (never echoing the duplicated email).
 */
export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('Email already exists');
    this.name = EmailAlreadyExistsError.name;
  }
}
