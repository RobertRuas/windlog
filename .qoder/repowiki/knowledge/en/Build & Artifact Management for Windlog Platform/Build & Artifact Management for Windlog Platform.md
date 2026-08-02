---
kind: build_system
name: Build & Artifact Management for Windlog Platform
category: build_system
scope:
    - '**'
source_files:
    - API/package.json
    - package.json
    - API/.github/workflows/ci.yml
    - API/nest-cli.json
    - API/tsconfig.build.json
    - API/prisma.config.ts
---

The Windlog platform uses a dual-package build system: a NestJS backend monorepo under `API/` and a Vite+React frontend at the repository root. There is no Dockerfile, Makefile, or shell-based deployment scripts in the repository; builds are driven by npm scripts and GitHub Actions CI.

**Backend (NestJS)**
- Build tooling: `@nestjs/cli` with `nest build` (configured via `nest-cli.json`, source root `src`, TypeScript config `tsconfig.json`). The production entry point is `dist/src/main.js` run through `npm run start:prod` which loads path aliases via `tsconfig-paths/register`.
- TypeScript compilation: separate `tsconfig.build.json` excludes tests and `node_modules`; Jest runs against `src` with `ts-jest` and collects coverage to `../coverage`.
- Database layer: Prisma v7 with a dedicated `prisma.config.ts` that defines schema location (`prisma/schema.prisma`), migration path (`prisma/migrations`), and datasource URL from `DATABASE_URL`. Scripts include `prisma:generate`, `prisma:migrate`, `prisma:studio`, and `prisma:seed` (via `tsx`).
- Linting/formatting: ESLint 9 + Prettier; test runner is Jest with unit and e2e configs.

**Frontend (Vite + React)**
- Build pipeline: `tsc -b` followed by `vite build`; development via `vite dev`; preview via `vite preview`. TypeScript project references are used (`-b`) to compile shared types before bundling.
- Dependencies: React 19, TanStack Query, i18next, Tailwind CSS (via `@tailwindcss/vite`), and ESLint for linting.

**CI/CD (GitHub Actions)**
- Workflow at `API/.github/workflows/ci.yml` triggers on push/pull-request to `main`.
- Matrix strategy runs Node 20.x and 22.x.
- Steps: checkout → setup Node with npm cache keyed on `API/package.json` → `npm ci` → `npx prisma generate` → `npm run lint` → `npm run build` → `npm test`.
- No artifact upload or deployment steps are defined in this workflow.

**Conventions & constraints observed**
- Both packages use ES modules (`"type": "module"`).
- Backend dependency installation uses `npm ci` in CI for deterministic installs.
- Prisma client generation is a mandatory CI step before lint/build/test.
- Test discovery follows `*.spec.ts` pattern in the backend; e2e tests live under `test/` with a separate Jest config.
- No containerization files (Dockerfile, docker-compose) are present in the repository despite a `.gitignore` reference to `docker-compose.override.yml`.