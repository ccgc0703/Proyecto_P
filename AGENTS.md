# AGENTS — Sistema de Gestión Scout Backend

This file captures the essential, verifiable facts an OpenCode agent needs to work in this repo without guessing. Each line answers "Would an agent likely miss this without help?". If not, it's left out.

## ⚡ Developer Commands (root)

| Command | What it does |
|-----|---|
| `npm ci` | Installs exact dependencies (CI‑only; prefer this over `npm install`) |
| `npm run build` | Compiles TypeScript (`dist/`) |
| `npm run start:dev` | Starts dev server with ts-node + dotenv |
| `npm test` | Runs Jest unit tests (backend only) |
| `npm run test:integration` | Runs integration tests — **requires PostgreSQL** running on `localhost:5432/poseidon` |
| `npm run test:cov` | Runs Jest with coverage |
| `npm run prisma:generate` | Generates Prisma client |
| `npm run prisma:migrate` | Deploys pending migrations (requires DB) |
| `npm run seed` | Seeds base data (unidades, roles, admin) — idempotente |
| `npm run seed:masivo` | Creates ~1000 test jóvenes — idempotente; use `--limpiar` flag to delete them |
| `npm run importar:indicadores` | Imports indicator catalog from Excel |
| `npm run load:test` | Runs load test script |
| `npm run lint` | Linter del frontend (`cd frontend && npm run lint`); no hay script `lint` en la raíz |

## 🛠 Toolchain & Quirks

- **dotenv loading**: `src/main.ts` line 1 imports `dotenv/config` **as the very first import**. If you add another import before it, `.env` won't load and the service will sign JWTs with a default secret — it will crash at startup if `JWT_SECRET` is missing (`process.exit(1)`).
- **JWT_SECRET validation**: `src/main.ts` requires `JWT_SECRET` with ≥32 characters. Generate with `openssl rand -base64 48`. Without it, the app exits.
- **CORS**: Default origins are `http://localhost:5173` and `http://localhost:4173` (Vite dev/preview). Override via `CORS_ORIGIN` env var. In CI the DB URL is set in `.github/workflows/ci.yml`.
- **Prisma**: `npm run prisma:generate` must run before `npm run prisma:migrate` or any Prisma operation. CI order: `generate → migrate → build → test`.
- **Rate limit (tests)**: To test without the throttler firewall, restart the API with `RATE_LIMIT_GLOBAL=1000000 node dist/src/main.js`.
- **Audit retention**: Default `AUDIT_RETENTION_DAYS=365`. Set `<=0` to disable the daily cleanup job. Manual: `POST /api/v1/audit/retencion?dias=N` (permiso `rbac:manage`).

## 📦 Monorepo / Package Boundaries

This is a **backend‑only** NestJS monorepo (single `package.json`). The frontend lives in `frontend/` with its own `package.json` and `AGENTS.md` — do not conflate the two.

**Backend entrypoints**:
- `src/main.ts` — app bootstrap (must run after dotenv)
- `src/app.module.ts` — root module

**Key modules** (under `src/modules/`): `auth`, `users`, `jovenes`, `ficha-medica`, `rbac`, `audit`, `catalogo`, `progresion`, `scout`, `unidades`, `administrativo`, `adultos`, `formacion`, `datos-scout`, `health`, `organizacion`, `programas-mundiales`.

Each module has its own `*.controller.ts`, `*.service.ts`, `*.module.ts`, and typically `dto/` and `strategies/` subfolders.

## 🧪 Testing Quirks

- **Jest config**: `rootDir: "src"`, `testRegex: ".*\\.spec\\.ts$"`, ignores `*.integration.spec.ts` (those are integration tests run separately).
- **Integration tests** (`npm run test:integration`): Require a running PostgreSQL at `localhost:5432/poseidon` with user `postgres`/`postgres`. They validate soft-delete, role reassignment, and restore logic. Data is seeded/cleaned per run.
- **Unit tests** (`npm test`): No external services needed; use `ts-jest`.
- **Frontend tests** (`cd frontend && npm test`): Vitest + jsdom; separate from backend.
- **E2E** (`cd frontend && npm run test:e2e`): Playwright; seeds user `joven.test@poseidon.com`; starts API + Vite dev server automatically.

## 🔧 Common Pitfalls (what agents often get wrong)

1. **Forgetting `dotenv/config` ordering** — Always ensure it's the first import in any file that reads env vars, or run `npm run start:dev` which handles it.
2. **Running `npm test` without having generated Prisma client** — Some tests may import Prisma models; always run `npm run prisma:generate` first if models changed.
3. **Confusing backend and frontend AGENTS.md** — The root `AGENTS.md` covers backend; `frontend/AGENTS.md` covers React + Vite.
4. **Assuming PostgreSQL is always running** — Integration tests and Prisma migrations require it. Use `docker compose up -d postgres` or ensure a local DB is available.
5. **Forgetting CORS origins** — If the frontend can't reach the API, check that `CORS_ORIGIN` includes the frontend URL (default `localhost:5173` or `localhost:4173`).
6. **Using `npm install` instead of `npm ci`** — `ci` uses the lockfile for deterministic installs; `install` may drift.

## 📚 Referenced Sources (keep these in sync)

- `package.json` — script definitions and dependency versions
- `README.md` — full installation, architecture, and business rules guide
- `.env.example` — env vars and defaults
- `.github/workflows/ci.yml` — CI job order and service definitions
- `src/main.ts` — env validation and bootstrap order
- `prisma/schema.prisma` — data model source of truth
- `frontend/AGENTS.md` — frontend‑specific rules (React/Vite/Zustand/MUI)