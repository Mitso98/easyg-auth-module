/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Same-origin API base path (proxied to the backend). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
