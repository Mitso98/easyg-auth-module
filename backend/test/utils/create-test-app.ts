import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { databaseConfig } from '../../src/config/database.config';

export interface TestContext {
  app: INestApplication;
  mongo: MongoMemoryServer;
  /** Clear the in-memory rate-limit counts (the global throttler stays active). */
  resetRateLimit: () => void;
  close: () => Promise<void>;
}

/**
 * Boots the REAL AppModule against an in-memory MongoDB. The DB connection is
 * injected by overriding the database config provider (timing-independent), and
 * the same `configureApp` pipeline as production is applied so tests exercise the
 * real prefix/versioning/ValidationPipe AND the global throttler.
 *
 * The throttler can't be cleanly disabled (it's an APP_GUARD enhancer), so
 * functional tests call `resetRateLimit()` between cases instead.
 */
export async function createTestApp(): Promise<TestContext> {
  // Pin the mongod binary so CI is reproducible.
  const mongo = await MongoMemoryServer.create({
    binary: { version: '7.0.14' },
  });

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(databaseConfig.KEY)
    .useValue({ uri: mongo.getUri() })
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();

  const storage = app.get<
    ThrottlerStorage & { storage?: Map<string, unknown> }
  >(ThrottlerStorage);

  return {
    app,
    mongo,
    resetRateLimit: () => storage.storage?.clear(),
    close: async () => {
      await app.close();
      await mongo.stop();
    },
  };
}
