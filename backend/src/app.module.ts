import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { envValidationSchema } from './config/env.validation';
import { NODE_ENV } from './common/constants';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, jwtConfig],
      // Fail-fast: invalid/missing env aborts boot, reporting every problem at once.
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    MongooseModule.forRootAsync({
      inject: [databaseConfig.KEY, appConfig.KEY],
      useFactory: (
        db: ConfigType<typeof databaseConfig>,
        app: ConfigType<typeof appConfig>,
      ) => ({
        uri: db.uri,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        // Build indexes automatically only in dev; in prod they are created
        // explicitly (the repository calls ensureIndexes on boot).
        autoIndex: app.nodeEnv === NODE_ENV.DEVELOPMENT,
      }),
    }),
    UsersModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
