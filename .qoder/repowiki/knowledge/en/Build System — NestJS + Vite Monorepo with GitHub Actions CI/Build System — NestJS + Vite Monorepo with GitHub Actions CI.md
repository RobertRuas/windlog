---
kind: build_system
name: Build System — NestJS + Vite Monorepo with GitHub Actions CI
category: build_system
scope:
    - '**'
source_files:
    - API/package.json
    - API/nest-cli.json
    - API/tsconfig.build.json
    - API/prisma.config.ts
    - API/.github/workflows/ci.yml
    - API/test/jest-e2e.json
    - package.json
---

This repository is a full-stack application composed of two independently built sub-projects: a NestJS backend under `API/` and a React/Vite frontend at the repository root. There is no shared Makefile or Docker setup; each side uses its own package manager (npm) and build toolchain, coordinated by a single GitHub Actions workflow for the backend.

**Backend (API/) — NestJS build pipeline**
- Build tooling: `@nestjs/cli` (`nest build`) driven by `nest-cli.json`, which sets `sourceRoot: src`, deletes the output directory on each build, and delegates TypeScript compilation to `tsconfig.json`. A separate `tsconfig.build.json` excludes tests and specs from the production build.
- Output: compiled JavaScript lands in `dist/` (ignored via `.gitignore`). The production entry point is `dist/src/main.js`, launched via `node -r tsconfig-paths/register dist/src/main.js` (`npm run start:prod`).
- Database schema & migrations: Prisma v7 is configured through `prisma.config.ts` (separate CLI config from runtime), with migrations stored under `prisma/migrations/`. Code generation is invoked via `npx prisma generate` before lint/build/test.
- Testing: Jest (unit tests under `src/**/*.spec.ts`) and Supertest-based e2e tests (`test/jest-e2e.json` targeting `*.e2e-spec.ts`). Coverage is collected into `coverage/`.
- Linting/formatting: ESLint 9 with TypeScript support plus Prettier, runnable via `npm run lint --fix` and `npm run format`.
- Scripts exposed: `build`, `start`, `start:dev`, `start:debug`, `start:prod`, `lint`, `test`, `test:watch`, `test:cov`, `test:e2e`, `prisma:generate`, `prisma:migrate`, `prisma:studio`, `prisma:seed`.

**Frontend (root `src/`) — Vite + React build pipeline**
- Build tooling: Vite 6 with the React plugin, TypeScript compilation via `tsc -b` before `vite build`. The `package.json` at the repo root defines `dev`, `build`, `lint`, and `preview` scripts.
- Output: standard Vite `dist/` directory (ignored by `.gitignore`).
- No test runner or CI step is defined for the frontend in this repository snapshot.

**CI/CD — GitHub Actions**
- Single workflow at `API/.github/workflows/ci.yml` triggers on push and pull requests to `main`.
- Matrix strategy runs the same steps against Node.js 20.x and 22.x.
- Pipeline order: checkout → setup Node with npm cache keyed on `API/package.json` → `npm ci` → `npx prisma generate` → `npm run lint` → `npm run build` → `npm test`.
- No artifact upload, container image build, or deployment step is present in the current workflow.

**Conventions and constraints observed**
- Each sub-project manages its own dependencies and build; there is no monorepo orchestrator (no lerna, nx, turborepo, etc.).
- Environment variables are loaded via `dotenv` during development; `.env*` files are gitignored and never committed.
- Prisma client must be regenerated (`prisma generate`) before any lint/build/test step — enforced by the CI workflow.
- Production builds exclude all `*.spec.ts` files and the `test/` directory via `tsconfig.build.json`.
- Uploads and generated Prisma client code (`prisma/generated/`) are gitignored; only migration SQL files are versioned.
- No Dockerfiles, Docker Compose, or Makefiles exist in the repository snapshot (only a reference to `docker-compose.override.yml` in `.gitignore`).