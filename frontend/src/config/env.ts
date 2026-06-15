/**
 * Frontend env, read and validated ONCE at startup. The default is a relative,
 * same-origin path ('/api/v1') so the browser only ever talks to its own origin
 * (Vite proxy in dev, nginx in prod) and the httpOnly cookie is sent. We fail
 * loud on an explicitly empty value rather than silently shipping a broken base.
 */
const DEFAULT_API_BASE_URL = '/api/v1';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? DEFAULT_API_BASE_URL;

if (typeof apiBaseUrl !== 'string' || apiBaseUrl.trim() === '') {
  throw new Error('VITE_API_URL must be a non-empty string');
}

export const env = {
  apiBaseUrl,
} as const;
