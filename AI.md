# AI Usage

How AI assistance was used on this project: what it generated, which prompts
worked, what was corrected, and decisions made differently from its suggestions.

## How I used AI

- **Requirements → solid prompt** — wrote down the project requirements first, then gave them to the AI to refine into a precise, unambiguous prompt. This front-loaded the thinking and avoided vague instructions that produce vague output.
- **AI-assisted rule writing** — used AI to help draft the `CLAUDE.md` rule files (architecture, security, database, frontend conventions). Describing *what* I wanted and asking it to make the rules explicit surfaced edge cases I hadn't considered.
- **Rules as a behaviour contract** — the rules weren't documentation; they were loaded into every AI session to constrain output to the expected patterns. Consistent rules meant consistent, reviewable code across the whole project.

## What I fixed / changed

- **`@node-rs/argon2`, not `node-argon2`.** Prebuilt binaries avoid the
  node-gyp/native-build Docker trap; argon2id over bcrypt (no 72-byte truncation).
- **`unhandledRejection` logs and keeps running** — it does *not* hard-exit
  (that's an availability footgun, worse on a cold-starting free tier);
  `process.exit(1)` is reserved for `uncaughtException`.
- **Same-origin everywhere, so no CSRF token** — a cross-site `pages.dev →
  onrender.com` split would silently drop the cookie. Reverse proxy for simplicity.
- **`@Res({ passthrough: true })`** to set the cookie while keeping Nest's
  serializer (and the `UserResponseDto` mapping) intact.
- **`openapi.json` as a CI artifact, not a git-diff gate** — swagger output isn't
  byte-stable across machines; a strict gate flakes red.
- **Access-only 15m JWT; no refresh rotation** — a precise RFC-9700 note, for simplicity.
- **`.dockerignore` in both `backend/` and `frontend/`** — excludes `node_modules/`, `dist/`, `.env`, test files, and editor artifacts from the build context; keeps the context small and prevents secrets from leaking into the image layer cache.
- **Removed layout shifts on the auth pages.** Three fixes: (1) `FormField` now renders its error `<p>` *unconditionally* (empty when valid) with a **reserved two-line slot** in CSS, so `mode:'onChange'` validation toggling a message never reflows the fields below while typing — two lines because the longest password rule ("…at least one special character") wraps in the narrow card, and an explicit `line-height` keeps the reservation deterministic. (2) `scrollbar-gutter: stable` on `html` stops the centered card jumping sideways when growing content makes the scrollbar appear. (3) Audited the rest and left it alone on purpose — the submit button is full-width (label swap doesn't resize it), the password eye-toggle is absolutely positioned, and the spinner→content + session-expiry banner are present on first paint, so none of them shift. Keeping the always-mounted error as a single `role="alert"` is also better for screen readers (announces an inserted message without remounting the node).

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

### Phase 2 — Auth core

- **Timing-uniform signin** — a `DUMMY_PASSWORD_HASH` is precomputed at boot via
  the *real* `PasswordHasher.hash()`; the unknown-email path still runs
  `verify()` against it, so response time doesn't reveal account existence.
  Unknown email and wrong password throw the *same* `INVALID_CREDENTIALS` 401.
- **argon2id** via `@node-rs/argon2` behind a `PasswordHasher` abstraction (DI
  seam); params centralized so real + dummy hashes share identical cost. A
  malformed stored hash makes `verify()` return false, never throw.
- **JWT is cookie-only** — issued as an httpOnly + SameSite=Lax cookie (Secure in
  prod), never in a response body (XSS-safe vs localStorage). The service signs +
  returns the string; the controller sets the cookie via `@Res({ passthrough })`
  so Nest still serializes the `UserResponseDto`.
- **NoSQL injection** closed at the DTO: `@IsString`/`@IsEmail` reject an operator
  object (`{ "$gt": "" }`) before it can reach a query; `strictQuery` is a second
  layer. Only `users.repository.ts` touches the model (single query surface); it
  maps Mongo `11000` → `EmailAlreadyExistsError` → generic 409 (no email echo).
- Build note: `isolatedModules` + `emitDecoratorMetadata` forces `import type`
  for type-only symbols used in decorated signatures (`ConfigType`, express
  `Response`) and forbids referencing the argon2 const enum by name.

### Phase 3 — Backend hardening

- **Error envelope** — one global `AllExceptionsFilter` shapes every failure into
  `{ code, message, timestamp, path, requestId }`. Security asymmetry: logs carry
  the full error, responses stay opaque (stacks / driver errors / `MONGO_URI`
  never leak); unknown errors collapse to a generic 500.
- **Structured logging** — `nestjs-pino` (pino over winston): one `x-request-id`
  threads logs + envelope + a response header for one-line triage; 4xx log at
  warn, 5xx at error; `/health` excluded; `pino-pretty` only outside prod.
  Redaction censors `authorization`/`cookie`/`*.password`/`*.token`.
- **Resilience** — `unhandledRejection` is **logged and the server keeps running**
  (hard-exiting on every stray rejection is an availability footgun, worse on a
  cold-starting free tier); `process.exit(1)` is reserved for `uncaughtException`,
  with `restart: unless-stopped` as the net.
- **Throttling** — global `ThrottlerGuard` + a tight `5/60s` on signin/signup
  (real client IP via `trust proxy`). In-memory store is per-instance and resets
  on restart — documented limitation, not durable brute-force protection (Redis
  in prod).

### Phase 4 — API docs + backend tests

- **Swagger** — `@nestjs/swagger` CLI plugin + explicit `@ApiProperty`/`@ApiOperation`
  decorators; UI at `/docs`, raw spec at `/docs-json`. `createSwaggerDocument` is
  shared by the UI and the `openapi:gen` script so both match.
- **openapi.json** — generated by a script in Nest **preview mode** (routes
  registered without instantiating providers → no DB needed in CI). Env defaults
  are set before a dynamic `import` of AppModule because `ConfigModule.forRoot`
  validates at import time; ts-node compiles as CommonJS so `import()` resolves
  `.ts`. Committed as the FE/BE contract; CI uploads it as an artifact (no brittle
  git-diff gate).
- **`configureApp` extracted** so integration tests run the exact production
  pipeline (prefix, versioning, ValidationPipe, cookies).
- **Tests (18, mongodb-memory-server pinned to 7.0.14)** — table-driven password
  policy; signup persists an argon2 hash (assert `verify()`, never the string);
  duplicate email (different case) → one generic 409 `EMAIL_TAKEN`; wrong-password
  and unknown-email → identical 401; `/me` 401/200 with no hash/JWT in the body;
  a **timing test** spying that `verify` runs exactly once on both failure paths;
  a 429 throttle test. The DB config provider is overridden with the memory URI
  (timing-independent); the APP_GUARD throttler can't be overridden, so tests
  reset its counts instead.
- Cleanup decision: the duplicate-error mapping moved out of the controller — the
  service throws the domain error and the global filter maps it (thinner
  controller, correct `EMAIL_TAKEN` code).

### Phase 5 — Frontend scaffold

- Atomic-design folders (`ui`/`composites`/`sections`/`layouts` → `pages`),
  `services`/`hooks`/`context`/`schemas`/`config`/`styles`. One global stylesheet
  (tokens + reset); everything else is a co-located CSS Module.
- **One axios instance** (`services/http.ts`), `withCredentials: true` so the
  httpOnly cookie rides along; a 401 interceptor calls an injected
  `onUnauthorized` (set by AuthContext — keeps the service layer free of
  React/router) and rejects with a normalized `{ message, code }`.
- **Env** validated once at startup; default `'/api/v1'` (relative, same-origin)
  so the browser only hits its own origin — the Vite dev proxy is the local
  mirror of the nginx proxy in deploy. `openapi.json` is the FE/BE contract.
- Router: central `createBrowserRouter` config with a placeholder `ProtectedRoute`
  over `/app`.
- Toolchain note: Vite 8 (rolldown) needs Node ≥20.19/22.12; the Docker `node:lts`
  image and CI satisfy it. Local typecheck/lint run on the older Node.

### Phase 6 — Frontend auth UI

- **Atomic design** — `ui` (Input/Button/IconButton/Spinner) → `composites`
  (FormField, PasswordInput owning the eye toggle) → `sections` (SignInForm,
  SignUpForm) → `layouts` (RootLayout) → `pages`. Every component has a co-located
  CSS Module; no inline styles.
- **One shared zod schema** (`auth.schema.ts`) mirrors the backend password policy
  verbatim; `confirmPassword` via `.refine`; types via `z.infer`. Client
  validation is UX only (server authoritative). zod **v4** uses top-level
  `z.email()`.
- **AuthContext tracks the USER, never the token** (httpOnly cookie). It hydrates
  once on mount via `GET /me` (401 = logged-out, not an error), memoizes its value
  + `useCallback`s actions, and lives inside the router (RootLayout) so it can
  navigate. The context object sits in its own module (React Fast Refresh rule).
- **authService** is the only caller of the axios instance; `confirmPassword` is
  never sent (and the backend would reject it). Signup auto-signs-in to establish
  the cookie.
- **ProtectedRoute** shows a spinner while `isInitializing` (no redirect-before-
  hydration flash), else redirects to `/signin` with `state.from`.
- **Anti-enumeration on the client** — auth failures show ONE generic form-level
  `role="alert"`, never inferring which field failed. a11y throughout
  (`htmlFor`/`id`, `aria-invalid`/`aria-describedby`, toggle `aria-pressed`).
  Confirm-password, eye toggle, and sign-out are deliberate extras.

### Phase 7 — FE wiring + tests

- **Cookie hydration** — AuthContext calls `getMe()` once on mount; a 401 there is
  "logged out", not an error. Successful signin/signup stores the user and the
  form navigates to the from-location or `/app`.
- **Session-expiry path** — the axios 401 interceptor calls AuthContext's
  handler, which uses a ref to tell an *expired active session* (→ redirect to
  `/signin` with `state.reason='expired'`, surfacing the polite `role="status"`
  banner) apart from the initial unauthenticated hydration or a failed signin.
- **Tests (Vitest + RTL, 10)** — table-driven `auth.schema` cases (each password
  rule, too-long, confirm-mismatch, bad email); SignUpForm shows the policy error
  and keeps submit disabled while invalid; ProtectedRoute redirects an
  unauthenticated `/app` visit to `/signin` (service mocked). Vitest over Jest for
  a Vite stack (shares the transform pipeline).
- Verified under Node 22: `tsc`, ESLint, all 10 tests, and the Vite production
  build pass. (The toolchain needs Node ≥20.19; the one-command demo is
  `docker compose up`, where the image runs `node:lts`.)

### Phase 8 — CI + dockerize + docs

- **CI** (`.github/workflows/ci.yml`): a `changes` job (`dorny/paths-filter`)
  gates a `[backend, frontend]` matrix (`fail-fast: false`) running
  install → lint → typecheck → test → build on Node 22; the mongod binary is
  cached. A separate job generates + uploads `openapi.json` (artifact, no diff
  gate); a `docker` job runs `docker compose build`. Status badge in the README.
- **Docker**: build bases pinned to `node:22-bookworm-slim` (Vite 8 needs
  ≥20.19); confirmed `docker compose config` parses and the stack is same-origin.
- **Docs**: README (mermaid architecture, env table, decisions now-vs-next,
  deployment + zero-downtime, demo), `SECURITY.md` threat model (control +
  limitation per attack), this AI.md consolidated into the four sections, and a
  `Makefile` (`up`/`test`/`openapi`/`verify`) mirroring CI.
- Out of scope by design: CD/auto-deploy, Redis throttler store, live deploy,
  multi-Node matrix, coverage upload.
