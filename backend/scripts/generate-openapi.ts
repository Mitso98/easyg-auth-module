/**
 * Writes openapi.json to the repo root from the live route metadata.
 *
 * Runs in Nest PREVIEW mode: routes/metadata are registered without
 * instantiating providers, so no Mongo connection (or any other resource) is
 * needed — the script works in CI with nothing but Node.
 *
 * Env defaults are set BEFORE importing AppModule (dynamically), because
 * `ConfigModule.forRoot()` validates process.env the moment the module is
 * imported. They are throwaway values only there to satisfy boot validation.
 */
process.env.MONGO_URI ??= 'mongodb://localhost:27017/openapi-gen';
process.env.JWT_SECRET ??= 'x'.repeat(32);

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

async function generate(): Promise<void> {
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('../src/app.module');
  const { configureApp } = await import('../src/app.setup');
  const { createSwaggerDocument } = await import('../src/swagger');

  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  // Apply the global prefix + versioning so documented paths match the real
  // routes (/api/v1/...).
  configureApp(app);
  const document = createSwaggerDocument(app);

  // backend/scripts -> repo root
  const outPath = join(__dirname, '..', '..', 'openapi.json');
  writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();

  // eslint-disable-next-line no-console
  console.log(`Wrote ${outPath}`);
}

void generate();
