import type { NormalizedError } from '../services/http';

const GENERIC = 'Something went wrong. Please try again.';

/**
 * Reduce any caught error to ONE user-facing message. We surface the server's
 * (already generic) message when present and never infer which field failed —
 * that would undermine the backend's anti-enumeration guarantee.
 */
export function mapApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as NormalizedError;
    if (typeof message === 'string' && message.trim() !== '') {
      return message;
    }
  }
  return GENERIC;
}
