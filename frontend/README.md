# Frontend — React + Vite (TypeScript) SPA

See the [root README](../README.md) for setup, architecture, the same-origin
proxy model, and the FE/BE contract (`openapi.json`).

Frontend-specific conventions (CSS Modules, atomic design, hooks, axios, a11y)
live in [CLAUDE.md](./CLAUDE.md).

```bash
npm install
npm run dev    # http://localhost:5173  (proxies /api -> backend, same-origin)
npm test
```
