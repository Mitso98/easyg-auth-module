# Backend Rules (NestJS)

Scoped rules for `backend/`. The repo-wide **same-origin** invariant and shared conventions live in the root `CLAUDE.md`. Items marked **(stretch)** are do-if-time. Each rule keeps its *why* — the rationale is the point.

## Backend Architecture
- **Apply DDD-style layering, OOP, and SOLID — the rules below are these principles made concrete, not buzzwords:**
  - **DDD** — each feature is a self-contained module (bounded context) with its own domain language; domain errors (e.g. `EmailAlreadyExists`) are mapped to HTTP only at the boundary, keeping the domain framework-agnostic.
  - **OOP** — behaviour lives in injectable classes/providers (services, repositories, a `PasswordHasher`), not loose functions or fat controllers.
  - **SOLID** — **S**: thin controllers + one responsibility per class (only the repository touches Mongoose). **O**: extend via new providers/strategies, not by editing core. **L**: implementations behind a token are substitutable (real vs in-memory repo in tests). **I**: small focused DTOs/interfaces, not god-objects. **D**: services depend on a `UsersRepository` abstraction + constructor DI, never on a concrete data layer.
- **Module-per-feature, not per-layer** — `AuthModule` + `UsersModule`, each owning its controller/service/repository/DTOs/schema. `src/common/` for cross-cutting, `src/config/` for config.
- **Strict layer flow** controller → service → repository → Mongoose model. Controllers are 1–5 lines (delegate + map); **only `*.repository.ts` touches the Model** (single sanitized query surface).
- **Validate every body** with class-validator DTOs + global `ValidationPipe({ whitelist:true, forbidNonWhitelisted:true, transform:true, transformOptions:{ enableImplicitConversion:false } })` — the DTO is the trust boundary (blocks mass-assignment + NoSQL operator smuggling).
- **Never let a Mongoose doc or hash cross the controller boundary** — return an explicit `UserResponseDto` (id, email, name); `passwordHash` is `select:false` in the schema as belt-and-suspenders.
- **Schema ≠ request DTO ≠ response DTO** — three small classes; don't conflate wire format with storage.
- **Typed `@nestjs/config` with boot-time env validation** (Joi/zod); app **refuses to start** on missing/invalid config. Ship `.env.example` (placeholders only).
- **Named constants/enums** for DI tokens, error messages, config keys, routes, validation limits — `as const` objects. The anti-enumeration message wording lives in one auditable place.
- **Global prefix + URI versioning** — `setGlobalPrefix('api')`, `enableVersioning({ type: URI, defaultVersion:'1' })`. Exclude `/health`. (Two lines of ceremony; keep it, don't over-defend it.)
- **Stateless, constructor-injected services**; avoid `Scope.REQUEST` unless genuinely needed.
- **Crypto/credential work in the service layer** behind a `PasswordHasher` provider — never in controllers/DTOs.
- **(stretch)** Program against an abstract `UsersRepository` token (`{ provide, useClass }`) — a cleaner test seam. A concrete repository already gives you a seam, so this is optional.

## Security
- **`@node-rs/argon2`** (argon2id, `memoryCost:19456, timeCost:2, parallelism:1`), per-hash salt automatic. No bcrypt fallback needed (prebuilt binaries).
- **Timing-uniform signin** — when the email is unknown, still run `verify` against a precomputed `DUMMY_PASSWORD_HASH` **generated via the exact same `PasswordHasher.hash()` path** (so params match real hashes) before returning, so response time can't enumerate accounts.
- **One generic failure message** for all signin failures (`AUTH_MESSAGES.INVALID_CREDENTIALS`); signup never echoes the email or confirms existence (map Mongo `11000` → generic conflict).
- **Coerce auth fields to primitive strings** before any query (`@IsString()` is layer 1) so `{"$gt":""}` can't become an operator; enable `strictQuery`; never spread `req.body` into a filter.
- **Normalize email** (trim + lowercase) at the DTO boundary; **unique index on the normalized field** (DB is the arbiter; defeats the TOCTOU race).
- **Cap input sizes at the DTO** — `name` ≤100, **`password` ≤128** (an unbounded password is an argon2 memory-DoS vector). Bound the JSON body too.
- **Throttle auth routes** with `@nestjs/throttler` — `@Throttle({ default:{ limit:5, ttl:60000 } })` on signin/signup; ensure the real client IP is used behind the proxy. (In-memory store resets on restart — see Resilience; document this limitation, don't claim durable brute-force protection.)
- **Helmet** (`app.use(helmet())`); **same-origin means no CORS in normal operation** — if you do enable CORS for a split dev setup, `credentials:true` **forbids `*`**: reflect the exact origin from an allowlist, never wildcard, never reflect arbitrary origins.
- **Cookie behind a proxy** — set `proxy_set_header X-Forwarded-Proto $scheme` at the proxy and make Nest trust it (`app.set('trust proxy', 1)`), or the `Secure` cookie won't set over TLS. Cookie flags: `httpOnly`, `sameSite:'lax'`, `secure` gated on `NODE_ENV==='production'`.
- **`JWT_SECRET` ≥32 bytes**, validated, no hardcoded fallback; `expiresIn:'15m'`, HS256. JWT is **cookie-only — never in the response body**.
- **Never log secrets/PII or the `MONGO_URI`** (it contains credentials); never return the hash or internal fields (allow-list serialization > deny-list).
- **(stretch)** Per-account lockout/backoff after N fails; refresh-token rotation; an Origin-allowlist guard *if* you ever go cross-site.

## Database
- **Single normalized email form** persisted (no raw-case copy); `email:{ lowercase:true, trim:true }`.
- **Unique index on the lowercase email field** (prefer this over a collation index — simpler query plans, no collation mismatch). `autoIndex:false` outside dev; build indexes explicitly.
- **`passwordHash: { select:false }`**; only `.select('+passwordHash')` in the signin lookup.
- **`.lean()` + explicit projection on all read paths** (`/me`, duplicate check); keep full documents only where you `.save()`.
- **Mirror DTO constraints at schema level** (`required`, `minlength`, `maxlength`) as a second enforcement layer; the DTO stays primary.
- **Hash in the service**, never in a `pre('save')` hook (avoids re-hash-on-update footgun).
- **`toJSON` transform** strips `passwordHash`/`__v`, maps `_id`→`id` — centralized redaction.
- **`timestamps:true`**; typed `@Schema()`/`@Prop()` + `MongooseModule.forFeature`.
- **`forRootAsync`** with the validated URI, `maxPoolSize:10`, `serverSelectionTimeoutMS:5000`; rely on the Nest lifecycle, no per-request connections.
- **Repository maps Mongo `11000` → domain `EmailAlreadyExists`** so the service never sees driver codes.
- **An integration test asserting the duplicate insert throws `11000`** is **core, not stretch** — the whole one-account/anti-enumeration invariant rests on this index.
- **(stretch)** A set-based repo method (`findByIds` with `$in`) to *show* N+1 awareness. There is no real N+1 in single-user auth — a one-line README note ("no N+1 paths exist here; list endpoints would batch with `$in`") is the more honest senior move than building contrived code.

## Error-Handling / Logging / Resilience
- **One global exception filter** → stable envelope `{ code, message, timestamp, path, requestId }`; branch on `instanceof HttpException`, everything else → generic 500. **Never leak stacks/driver errors/the `MONGO_URI`.**
- **Domain errors → HTTP status at the boundary**, not `HttpException` thrown from services (keeps services HTTP-agnostic + testable).
- **Structured JSON logging via `nestjs-pino`** with a per-request correlation id (reuse/generate `x-request-id`); pino over winston, stated in the README. Echo `x-request-id` back as a response header.
- **Redact at the logger** — `redact:['req.headers.authorization','req.headers.cookie','*.password','*.confirmPassword','*.token']`; never `console.log` a DTO holding a password; ensure the `MONGO_URI` is never serialized into a log on a connection error.
- **The process never dies *silently*, but a stray rejection must not take the server down.** `process.on('unhandledRejection')` → **log at `error` with context, do NOT exit.** Reserve `process.exit(1)` for `uncaughtException` only (genuinely corrupted state), with `restart: unless-stopped` in compose as the safety net. (Promoting every rejection to a hard exit is an availability footgun — especially on a cold-starting free tier.)
- **Graceful shutdown** — `app.enableShutdownHooks()` + trap SIGTERM/SIGINT to close Mongoose. Keep it to those lines; don't build elaborate drain logic.
- **Deliberate log levels from a validated `LOG_LEVEL`** — expected 4xx (bad creds, validation) at `warn`/`info`, only unexpected 5xx at `error`/`fatal`; `pino-pretty` only when not production.
- **Fail-fast on boot** for missing required config; **bounded body** (`json({ limit:'16kb' })`).
