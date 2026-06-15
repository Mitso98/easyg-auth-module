import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request from 'supertest';
import { createTestApp, TestContext } from '../../test/utils/create-test-app';
import { AUTH_MESSAGES, ERROR_CODES } from '../common/constants';
import { PasswordHasher } from '../common/security/password-hasher';
import { User, UserDocument } from '../users/schemas/user.schema';

const SIGNUP = '/api/v1/auth/signup';
const SIGNIN = '/api/v1/auth/signin';
const ME = '/api/v1/auth/me';

const CREDS = {
  email: 'ada@example.com',
  name: 'Ada Lovelace',
  password: 'Sup3r$ecret',
};

describe('Auth (integration)', () => {
  let ctx: TestContext;
  let app: INestApplication;
  let userModel: Model<UserDocument>;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
    userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await ctx.close();
  });

  afterEach(async () => {
    await userModel.deleteMany({});
    // Keep the throttler active but reset its counts so cumulative requests
    // across tests don't trip the 5/60s auth limit.
    ctx.resetRateLimit();
  });

  describe('POST /signup', () => {
    it('creates a user and never returns the hash', async () => {
      const res = await request(app.getHttpServer()).post(SIGNUP).send(CREDS);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ email: CREDS.email, name: CREDS.name });
      expect(res.body.id).toBeDefined();
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('stores an argon2 hash, not the plaintext', async () => {
      await request(app.getHttpServer()).post(SIGNUP).send(CREDS);
      const stored = await userModel
        .findOne({ email: CREDS.email })
        .select('+passwordHash')
        .lean();
      expect(stored?.passwordHash).toBeDefined();
      expect(stored?.passwordHash).not.toBe(CREDS.password);
      // Verify via the real hasher (assert behaviour, not the hash string).
      const hasher = app.get(PasswordHasher);
      expect(await hasher.verify(stored!.passwordHash, CREDS.password)).toBe(
        true,
      );
    });

    it('rejects a duplicate email (different case) with a generic conflict', async () => {
      await request(app.getHttpServer()).post(SIGNUP).send(CREDS).expect(201);
      const res = await request(app.getHttpServer())
        .post(SIGNUP)
        .send({ ...CREDS, email: 'ADA@Example.com' });
      expect(res.status).toBe(409);
      expect(res.body.message).toBe(AUTH_MESSAGES.EMAIL_TAKEN);
      expect(res.body.code).toBe(ERROR_CODES.EMAIL_TAKEN);
      // Generic — must not echo the submitted address.
      expect(JSON.stringify(res.body)).not.toContain('ADA@Example.com');
    });
  });

  describe('POST /signin', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post(SIGNUP).send(CREDS).expect(201);
    });

    it('sets an httpOnly cookie on valid credentials and no token in the body', async () => {
      const res = await request(app.getHttpServer())
        .post(SIGNIN)
        .send({ email: CREDS.email, password: CREDS.password });
      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.join(';')).toContain('access_token=');
      expect(cookies.join(';').toLowerCase()).toContain('httponly');
      expect(res.body.access_token).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toMatch(/eyJ/); // no JWT in body
    });

    it('returns the SAME 401 for a wrong password and an unknown email', async () => {
      const wrongPassword = await request(app.getHttpServer())
        .post(SIGNIN)
        .send({ email: CREDS.email, password: 'Wr0ng$pass' });
      const unknownEmail = await request(app.getHttpServer())
        .post(SIGNIN)
        .send({ email: 'nobody@example.com', password: CREDS.password });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongPassword.body.message).toBe(
        AUTH_MESSAGES.INVALID_CREDENTIALS,
      );
      expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
    });
  });

  describe('GET /me', () => {
    it('is 401 without a cookie', async () => {
      await request(app.getHttpServer()).get(ME).expect(401);
    });

    it('returns the current user (no hash, no token) with a valid cookie', async () => {
      await request(app.getHttpServer()).post(SIGNUP).send(CREDS).expect(201);
      const signin = await request(app.getHttpServer())
        .post(SIGNIN)
        .send({ email: CREDS.email, password: CREDS.password });
      const cookies = signin.headers['set-cookie'] as unknown as string[];

      const res = await request(app.getHttpServer())
        .get(ME)
        .set('Cookie', cookies);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ email: CREDS.email, name: CREDS.name });
      expect(res.body.passwordHash).toBeUndefined();
    });
  });

  describe('timing-uniformity', () => {
    it('runs hasher.verify exactly once on BOTH the unknown-email and wrong-password paths', async () => {
      await request(app.getHttpServer()).post(SIGNUP).send(CREDS).expect(201);
      const verifySpy = jest.spyOn(app.get(PasswordHasher), 'verify');

      verifySpy.mockClear();
      await request(app.getHttpServer())
        .post(SIGNIN)
        .send({ email: CREDS.email, password: 'Wr0ng$pass' });
      expect(verifySpy).toHaveBeenCalledTimes(1);

      verifySpy.mockClear();
      await request(app.getHttpServer())
        .post(SIGNIN)
        .send({ email: 'nobody@example.com', password: CREDS.password });
      expect(verifySpy).toHaveBeenCalledTimes(1);

      verifySpy.mockRestore();
    });
  });
});
