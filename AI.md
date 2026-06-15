# AI Usage

How AI assistance was used on this project: what it generated, which prompts
worked, what was corrected, and decisions made differently from its suggestions.

## How I used AI

_TODO: overall approach — where AI moved fast (scaffolding, boilerplate,
validation logic) and where human judgement drove the result._

## Prompts that worked

_TODO: prompts/approaches that produced good output with little rework._

## What I fixed / changed

_TODO: where AI output needed correcting before it was usable._

## Decisions made differently

- **Password hasher: `@node-rs/argon2`, not `node-argon2`.** `@node-rs/argon2`
  ships prebuilt native binaries, so it avoids native compilation (no
  build-essential / `node-gyp` toolchain) in the Docker image — faster, smaller,
  and more reliable builds. Argon2 (over bcrypt) for a modern memory-hard KDF.

_TODO: other decisions made against the default AI suggestion._

## Per-phase log

### Phase 0 — Monorepo scaffold

- `/backend` (NestJS, npm) and `/frontend` (Vite + React-TS) as sibling packages.
- Root hygiene: `.gitignore`, `CLAUDE.md`, `README.md`, this `AI.md`.
- `backend/.env.example` and `frontend/.env.example` (placeholders only).
- Same-origin Docker setup: `docker-compose.yml` (mongo + backend + nginx
  frontend), per-package multi-stage `Dockerfile`s, and `frontend/nginx.conf`
  reverse-proxying `/api` to the backend.
- Added `@node-rs/argon2` as the backend password-hasher dependency.

_TODO: subsequent phases (auth API, frontend forms, tests, ...)._
