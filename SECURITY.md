# Threat Model

Each attack mapped to its control **and** its honest limitation. Judgment over
disclosure — the limitations are the point.

| Threat | Control | Limitation / next step |
|---|---|---|
| **User enumeration** | One generic message for every signin failure; signup never confirms an email exists (Mongo `11000` → generic 409, no echo) | — |
| **Timing oracle** (enumeration via response time) | Unknown-email path still runs `verify()` against a precomputed dummy hash built via the *same* `PasswordHasher.hash()` path; a test asserts `verify` runs exactly once on both failure paths | argon2 timing has natural variance; the dummy-hash equalizes the dominant cost, not every nanosecond |
| **NoSQL operator injection** (`{"$gt":""}`) | `@IsString`/`@IsEmail` DTOs coerce auth fields to strings before any query; global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted`); Mongoose `strictQuery`; only the repository touches the model | — |
| **XSS token theft** | JWT lives in an **httpOnly** cookie (JS-unreadable) — never in `localStorage` or a response body | httpOnly mitigates exfiltration, not XSS itself; helmet sets baseline headers. A strict CSP is a next step |
| **CSRF** | **Same-origin** + `SameSite=Lax` + httpOnly closes it with no token | If ever split cross-site: switch to `SameSite=None;Secure` **and add an Origin-allowlist guard** (not just flip SameSite) |
| **Brute force** | `@nestjs/throttler` 5/60s on signin & signup; real client IP via `trust proxy` | **In-memory store is per-instance and resets on restart** — not durable. Production: a shared store (Redis) + optional per-account lockout |
| **argon2 memory-DoS** | Password capped at **128** chars at the DTO; JSON body bounded to 16kb | — |
| **Account takeover via duplicate signup (TOCTOU)** | Unique index on the normalized (lowercase) email — the **DB** is the arbiter, not an app-level check; integration test covers it | — |
| **Credential / PII leakage in logs** | pino `redact` for `authorization`/`cookie`/`*.password`/`*.token`; `MONGO_URI` never logged; `passwordHash` is `select:false` + stripped in `toJSON` and the response DTO | — |
| **Information leak via errors** | One exception filter → stable envelope `{ code, message, timestamp, path, requestId }`; stacks/driver errors/URI never reach the client; unknown errors collapse to a generic 500 | — |
| **Weak/managed secrets** | `JWT_SECRET` ≥ 32 chars, boot-validated, no hardcoded fallback; secrets gitignored | Production: a secrets manager + rotation |
| **Transport security** | `Secure` cookie gated on `NODE_ENV=production`; behind a proxy, `X-Forwarded-Proto` + `trust proxy` so it sets under TLS | TLS termination is the proxy/platform's responsibility |

## Notes

- **Availability:** a stray `unhandledRejection` is logged but does **not** exit
  the process (hard-exit-on-every-rejection is an availability footgun);
  `process.exit(1)` is reserved for `uncaughtException`, with
  `restart: unless-stopped` as the net.
- **Auth model:** access-only 15m JWT. Refresh-token rotation with reuse
  detection (RFC 9700) is the documented next step, deliberately not built.
