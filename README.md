# Auth Module — NestJS + React (TypeScript)

A production-minded sign-up / sign-in module: a NestJS + MongoDB API and a
Vite + React (TypeScript) frontend, served same-origin behind nginx.

## Overview

_TODO: short description of the auth flows (sign up, sign in, protected page)._

## Architecture

```
TODO: diagram
Browser ──▶ nginx (frontend :8080) ──┬──▶ static SPA
                                     └──▶ /api ──▶ backend (NestJS) ──▶ MongoDB
```

Single origin: the browser only ever talks to nginx, which serves the built SPA
and reverse-proxies `/api/*` to the backend — so there is no CORS and cookies
work normally.

## Quick Start

Requires Docker (with Compose).

```bash
# 1. Create the backend env file and set a JWT secret
cp backend/.env.example backend/.env
# then edit backend/.env — generate a secret with: openssl rand -base64 48

# 2. Bring up mongo + backend + frontend
docker compose up --build
```

Then open **http://localhost:8080**. The API is reachable same-origin under
`/api` (e.g. `http://localhost:8080/api/v1/...`).

## Local Dev

_TODO: running each package directly (`npm run start:dev` in `backend`,
`npm run dev` in `frontend`) against a local/compose Mongo. The Vite dev server
proxies `/api` to the backend, so the frontend stays same-origin._

## Environment Variables

_TODO: document each key. See `backend/.env.example` and
`frontend/.env.example` for the full list and placeholders._

## API Docs

_TODO: endpoint reference (and Swagger URL, if added)._

## Testing

_TODO: how to run backend/frontend tests._

## Deployment

_TODO: production notes (image build, secrets, reverse proxy)._

## Decisions

_TODO: notable choices and trade-offs. See `AI.md` for the AI-assisted log._
