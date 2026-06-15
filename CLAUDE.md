# Project Rules

A NestJS (`backend/`) + React-Vite (`frontend/`) monorepo for a user auth module. The detailed conventions live next to the code they govern, in package-level `CLAUDE.md` files, so each part of the codebase only carries the rules relevant to it. This root file holds only what applies everywhere.

## Core invariant — stay same-origin
The SPA and API are **same-origin in every environment**: Vite dev proxy locally, nginx reverse-proxy (or Nest-serves-SPA) in deploy. This is what makes the httpOnly auth cookie work and removes CORS/CSRF concerns. **Do not break it.** A cross-site split silently drops the `SameSite` cookie and kills auth.

## Repo-wide conventions
- **No magic strings/numbers** — use named constants/enums; share a single source for values both packages must agree on (e.g. the password policy). (Backend specifics — DI tokens, error messages — in `backend/CLAUDE.md`.)
- **Conventional commits** — `type(scope): subject` (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`). Keep history clean and scannable.
- **Co-locate tests** with the code they cover; write them per-feature, not batched at the end.
- **Secrets never committed or logged** — `.env` is gitignored, only `.env.example` (placeholders) is tracked; never log credentials or the `MONGO_URI`.
- **Client validation is UX; the server is authoritative** — mirror the password policy on both sides, but trust only the backend.

## Rule locations (loaded on demand)
Claude Code reads a package's `CLAUDE.md` when working inside that folder, so the relevant rules load automatically:
- **`backend/CLAUDE.md`** — Backend Architecture · Security · Database · Error-Handling/Logging/Resilience.
- **`frontend/CLAUDE.md`** — Frontend (components, hooks, atomic design, routing, axios, a11y).
