/** Stable machine-readable codes for the error envelope — clients branch on
 *  these, not on prose. One auditable place for the whole catalogue. */
export const ERROR_CODES = {
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL_SERVER_ERROR',
} as const;

/** HTTP status → code map for HttpExceptions without a more specific mapping. */
export const STATUS_TO_CODE: Record<number, string> = {
  400: ERROR_CODES.VALIDATION,
  401: ERROR_CODES.UNAUTHORIZED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  409: ERROR_CODES.CONFLICT,
  429: ERROR_CODES.RATE_LIMITED,
};
