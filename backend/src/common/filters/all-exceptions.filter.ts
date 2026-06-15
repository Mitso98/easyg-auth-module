import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Request, Response } from 'express';
import { AUTH_MESSAGES, ERROR_CODES, STATUS_TO_CODE } from '../constants';
import { EmailAlreadyExistsError } from '../errors/email-already-exists.error';

/** 5xx threshold as a plain number (avoids enum-vs-number comparison friction). */
const SERVER_ERROR_MIN = 500;

interface ErrorEnvelope {
  code: string;
  message: string | string[];
  timestamp: string;
  path: string;
  requestId?: string;
}

/**
 * The single point that shapes EVERY error response into a stable envelope
 * `{ code, message, timestamp, path, requestId }`. Security asymmetry: logs are
 * rich (full error + correlation id), responses are opaque — stacks, driver
 * errors, and the MONGO_URI never reach the client. Expected 4xx log at warn;
 * only unexpected 5xx log at error.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const res = ctx.getResponse<Response>();

    const { status, code, message } = this.resolve(exception);
    const requestId = req.id ?? (req.headers['x-request-id'] as string);

    if (status >= SERVER_ERROR_MIN) {
      // Unexpected — keep the full error in the logs only.
      this.logger.error(
        { err: exception, requestId, path: req.url },
        'Unhandled exception',
      );
    } else {
      this.logger.warn({ requestId, path: req.url, code }, 'Request failed');
    }

    const envelope: ErrorEnvelope = {
      code,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
      requestId,
    };
    res.status(status).json(envelope);
  }

  private resolve(exception: unknown): {
    status: number;
    code: string;
    message: string | string[];
  } {
    // Domain error safety net (the controller maps it too) — generic, no echo.
    if (exception instanceof EmailAlreadyExistsError) {
      return {
        status: HttpStatus.CONFLICT,
        code: ERROR_CODES.EMAIL_TAKEN,
        message: AUTH_MESSAGES.EMAIL_TAKEN,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        status,
        code: STATUS_TO_CODE[status] ?? ERROR_CODES.INTERNAL,
        message: this.extractMessage(exception),
      };
    }

    // Anything else is a genuine surprise → opaque 500.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL,
      message: 'Internal server error',
    };
  }

  private extractMessage(exception: HttpException): string | string[] {
    const response = exception.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      return (response as { message: string | string[] }).message;
    }
    return exception.message;
  }
}
