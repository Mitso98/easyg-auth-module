/** Route segments in one place so controllers and tests never drift on a string. */
export const ROUTES = {
  AUTH: 'auth',
  SIGN_UP: 'signup',
  SIGN_IN: 'signin',
  SIGN_OUT: 'signout',
  ME: 'me',
  HEALTH: 'health',
} as const;

/** API surface ceremony — kept here so main.ts reads declaratively. */
export const API = {
  PREFIX: 'api',
  DEFAULT_VERSION: '1',
} as const;
