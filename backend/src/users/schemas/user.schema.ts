import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { VALIDATION } from '../../common/constants';

export type UserDocument = HydratedDocument<User>;

/**
 * Storage model — deliberately distinct from the request/response DTOs.
 *
 * Layered hash protection: `passwordHash` is `select: false` (never returned by
 * default; only the signin lookup opts in with `.select('+passwordHash')`), and
 * the `toJSON` transform strips it + `__v` and maps `_id` -> `id` as a single
 * centralized redaction point. Schema length limits mirror the DTO as a second
 * enforcement layer (the DTO stays primary). Email is normalized at the schema
 * level too (lowercase + trim) so the unique index always sees one canonical form.
 */
@Schema({
  timestamps: true,
  // Strip query conditions on non-schema paths — defence in depth against an
  // operator object slipping into a filter (the DTO is the primary guard).
  strictQuery: true,
  toJSON: {
    versionKey: false,
    virtuals: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.passwordHash;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({
    required: true,
    trim: true,
    minlength: VALIDATION.NAME.MIN,
    maxlength: VALIDATION.NAME.MAX,
  })
  name: string;

  @Prop({ required: true, select: false })
  passwordHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

/**
 * Unique index on the normalized email — the DATABASE is the arbiter of the
 * one-account-per-email invariant (defeats the check-then-insert TOCTOU race
 * that an application-level "does it exist?" check would lose). A duplicate
 * insert surfaces as Mongo error 11000, mapped to a domain error in the repository.
 */
UserSchema.index({ email: 1 }, { unique: true });
