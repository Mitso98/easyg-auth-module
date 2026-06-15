import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmailAlreadyExistsError } from '../common/errors/email-already-exists.error';
import { User, UserDocument } from './schemas/user.schema';

/** Shape returned by the lean `/me` read — a plain projection, no Mongoose doc. */
export interface LeanUser {
  _id: Types.ObjectId;
  email: string;
  name: string;
  createdAt: Date;
}

const MONGO_DUPLICATE_KEY = 11000;

/**
 * The ONLY code that touches the Mongoose model — a single sanitized query
 * surface. It maps the driver's 11000 duplicate-key error to a domain error so
 * the service never sees raw driver codes.
 */
@Injectable()
export class UsersRepository implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly model: Model<UserDocument>,
  ) {}

  /** Build indexes explicitly so the unique-email invariant holds even with
   *  autoIndex off (production). */
  async onModuleInit(): Promise<void> {
    await this.model.ensureIndexes();
  }

  async createUser(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    try {
      return await this.model.create(data);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new EmailAlreadyExistsError();
      }
      throw error;
    }
  }

  /** Signin lookup — the one place that opts into the hidden passwordHash. */
  findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email }).select('+passwordHash').exec();
  }

  /** `/me` read — lean + explicit projection, never selects the hash. */
  findByIdLean(id: string): Promise<LeanUser | null> {
    return this.model
      .findById(id)
      .select('email name createdAt')
      .lean<LeanUser | null>()
      .exec();
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: number }).code === MONGO_DUPLICATE_KEY
    );
  }
}
