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

### Phase 1 — Backend foundation

- **Fail-fast config** — `@nestjs/config` with a Joi schema; app refuses to boot
  on missing/invalid env (verified: blank `JWT_SECRET` → exit 1). Typed access via
  `registerAs` namespaces (`app`/`database`/`jwt`), not scattered string lookups.
- `MONGO_URI` validated by scheme regex (not `Joi.uri()`) so Atlas SRV strings
  with query options aren't rejected; the URI is never logged (carries credentials).
- **User schema** — unique index on the normalized (lowercase/trim) email is the
  DB-enforced one-account invariant (beats an app-level check + its TOCTOU race).
  Hash protection is layered: `passwordHash: select:false` + a `toJSON` transform
  that strips `passwordHash`/`__v` and maps `_id`→`id`.
- `main.ts` wiring: global `api` prefix + URI versioning (default `1`), `/health`
  excluded (version-neutral Terminus Mongoose ping), global `ValidationPipe`
  (whitelist/forbid/transform, no implicit conversion), helmet, 16kb body cap,
  `trust proxy`, shutdown hooks. Compose backend healthcheck hits `/health`.

_TODO: subsequent phases (auth core, hardening, docs/tests, frontend, ops)._
