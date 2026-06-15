import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { ROUTES } from '../common/constants';

/**
 * Liveness/readiness probe. Version-neutral and excluded from the global `/api`
 * prefix (see main.ts) so orchestrators and the compose healthcheck hit a plain
 * `/health`. A single Mongoose ping is the right scope here — not a
 * liveness/readiness matrix. It also underpins zero-downtime deploys
 * (health-gated rolling / nginx blue-green) without any extra code.
 */
@SkipThrottle()
@Controller({ path: ROUTES.HEALTH, version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.mongoose.pingCheck('mongodb')]);
  }
}
