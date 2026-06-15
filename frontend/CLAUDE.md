# Frontend Rules (React + Vite + TS)

Scoped rules for `frontend/`. The repo-wide **same-origin** invariant and shared conventions live in the root `CLAUDE.md`. Items marked **(stretch)** are do-if-time. Each rule keeps its *why* — the rationale is the point.

## Frontend
- **CSS Modules only** — `Component.module.css` co-located; **no inline `style` props**, no globals except one `global.css` (tokens + reset) imported once.
- **Logic in custom hooks** (`useAuth`, `usePasswordToggle`); components render + wire callbacks only.
- **Single `AuthContext`** exposing user + actions + `isInitializing`; never read auth state ad hoc. (Token lives in the httpOnly cookie — the SPA never touches it; context tracks the *user*, hydrated via `GET /me`.)
- **One axios instance** (`src/services/http.ts`), `withCredentials:true` so the cookie rides along. Response interceptor catches 401 → clear auth + redirect `/signin`, and normalizes errors to `{ message, code }`. Feature services call `api`, never `axios`.
- **Declarative `ProtectedRoute`** — `<Navigate to='/signin' replace state={{from:location}}/>`; an `isInitializing` flag prevents a redirect-before-hydration flash.
- **react-hook-form + zod**, one shared `auth.schema.ts` mirroring the backend policy verbatim; `confirmPassword` via `.refine`. Client validation is **UX only** — the server is authoritative.
- **Confirm-password + eye toggle + sign-out** are deliberate extras beyond the PDF — documented as such.
- **Accessibility** — `htmlFor`/`id` pairing, toggle `aria-label` + `aria-pressed`, errors `role='alert'` + `aria-invalid` + `aria-describedby`.
- **Atomic design, plain-English tiers** — `ui/` (primitives) → `composites/` (small combos) → `sections/` (feature blocks) → `layouts/` (page structure) → `pages/` (routes). These are friendly aliases for atoms/molecules/organisms/templates/pages — the mapping is noted in the README so it reads as deliberate atomic design. Dependency direction is small → big. PascalCase components, `use*` hooks, co-located `.module.css` + `.test.tsx`. For this small app, `layouts/` may absorb the template tier rather than adding a separate one.
- **Pure helpers in `utils/`, network in `services/`**; components contain no fetch logic.
- **`import.meta.env.VITE_*`** validated once at startup (throw if `VITE_API_URL` absent); committed `.env.example`.
- **`lucide-react`**, named imports only (`Eye, EyeOff, LogOut`).
- **Normalized error path** — one generic auth-failure alert (don't infer which field failed → don't undermine the backend's anti-enumeration); top-level Error Boundary.
- **No toast/notification library** (sonner/react-hot-toast/react-toastify) — every feedback moment has a correct home: validation + auth-failure stay **inline/form-level** `role='alert'` (persistent, anti-enumeration-safe, re-readable on resubmit), and success/sign-out are communicated by **navigation**. The only non-inline-anchored notice — the silent 401/session-expiry redirect (the 15m cookie JWT guarantees users hit it) — is surfaced as a small **inline `role='status'` banner** (polite, no auto-dismiss, no focus-steal) on the SignIn page, fed by the axios 401 interceptor via router location state. Toasts are an anti-pattern for blocking/field/auth-error feedback and add WCAG 2.2.1/4.1.3 risk + bundle cost for zero gain. Revisit only if async/background/optimistic actions are added later (then prefer `sonner`).
- **(stretch)** Memoize the `AuthContext` value + `useCallback` actions.
