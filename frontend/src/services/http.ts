import axios from 'axios';
import type { AxiosError } from 'axios';
import { env } from '../config/env';

/** Normalized error shape every feature service and the UI can rely on. */
export interface NormalizedError {
  message: string;
  code?: string;
}

interface ApiErrorBody {
  message?: string | string[];
  code?: string;
}

type UnauthorizedHandler = () => void;

// Injected by AuthContext so the interceptor can clear auth + redirect without
// the service layer importing React/router (keeps layers decoupled).
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

/** The ONE axios instance. `withCredentials` so the httpOnly cookie rides along. */
export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
  withCredentials: true,
});

function normalizeError(error: AxiosError<ApiErrorBody>): NormalizedError {
  const body = error.response?.data;
  const rawMessage = body?.message;
  const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
  return {
    message: message ?? error.message ?? 'Something went wrong. Please try again.',
    code: body?.code,
  };
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    // Reject with the normalized shape, not the raw axios error.
    return Promise.reject(normalizeError(error));
  },
);
