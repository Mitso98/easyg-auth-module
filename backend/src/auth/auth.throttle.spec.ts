import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, TestContext } from '../../test/utils/create-test-app';

const SIGNIN = '/api/v1/auth/signin';
const ATTEMPT = { email: 'nobody@example.com', password: 'Wr0ng$pass' };

describe('Auth throttling', () => {
  let ctx: TestContext;
  let app: INestApplication;

  beforeAll(async () => {
    ctx = await createTestApp();
    app = ctx.app;
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('blocks the 6th signin attempt within the window with 429', async () => {
    // The first 5 are allowed (and fail auth with 401); the 6th is rate-limited.
    for (let i = 0; i < 5; i++) {
      const res = await request(app.getHttpServer()).post(SIGNIN).send(ATTEMPT);
      expect(res.status).toBe(401);
    }
    const blocked = await request(app.getHttpServer())
      .post(SIGNIN)
      .send(ATTEMPT);
    expect(blocked.status).toBe(429);
  });
});
