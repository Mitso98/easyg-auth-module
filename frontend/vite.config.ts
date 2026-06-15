import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Same-origin in dev: forward /api/* to the backend so the browser only
    // ever talks to the Vite dev server (no CORS, cookies just work).
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Don't process CSS Modules in tests — class lookups return undefined, which
    // our className helpers tolerate; assertions target roles/text, not classes.
    css: false,
  },
})
