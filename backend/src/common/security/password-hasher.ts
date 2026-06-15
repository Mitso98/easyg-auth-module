import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { ARGON2_OPTIONS } from '../constants';

/**
 * Abstraction (DI token) for credential hashing. Services depend on THIS, not on
 * a concrete library — the SOLID dependency-inversion seam that also lets tests
 * swap in a fast fake. All crypto stays here, never in controllers/DTOs.
 */
export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;
  abstract verify(hashed: string, plain: string): Promise<boolean>;
}

/**
 * argon2id implementation (prebuilt @node-rs binaries). Per-hash salt is applied
 * automatically; a malformed stored hash makes verify() return false rather than
 * throw, so a corrupt record can't 500 the signin path.
 */
@Injectable()
export class Argon2PasswordHasher extends PasswordHasher {
  hash(plain: string): Promise<string> {
    return hash(plain, ARGON2_OPTIONS);
  }

  async verify(hashed: string, plain: string): Promise<boolean> {
    try {
      return await verify(hashed, plain, ARGON2_OPTIONS);
    } catch {
      return false;
    }
  }
}
