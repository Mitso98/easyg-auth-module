import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { COOKIE } from './common/constants';

/** Build the OpenAPI document. Shared by the served UI and the openapi:gen
 *  script so both describe exactly the same API. */
export function createSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription(
      'User authentication module. The JWT is delivered as an httpOnly cookie ' +
        '(`access_token`) and is never returned in a response body.',
    )
    .setVersion('1.0')
    .addCookieAuth(COOKIE.ACCESS_TOKEN, {
      type: 'apiKey',
      in: 'cookie',
      name: COOKIE.ACCESS_TOKEN,
      description: 'httpOnly JWT cookie set on signin.',
    })
    .build();
  return SwaggerModule.createDocument(app, config);
}

/** Serve Swagger UI at /docs and the raw JSON at /docs-json. */
export function setupSwagger(app: INestApplication): void {
  const document = createSwaggerDocument(app);
  SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs-json' });
}
