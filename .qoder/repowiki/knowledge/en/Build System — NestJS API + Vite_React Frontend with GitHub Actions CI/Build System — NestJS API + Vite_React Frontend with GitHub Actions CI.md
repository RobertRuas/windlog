---
kind: build_system
name: Build System — NestJS API + Vite/React Frontend with GitHub Actions CI
category: build_system
scope:
    - '**'
source_files:
    - API/package.json
    - API/nest-cli.json
    - API/tsconfig.build.json
    - .github/workflows/ci.yml
    - package.json
    - tsconfig.json
---

This repository is a monorepo containing two independently built applications: a NestJS REST API under `API/` and a React frontend under `src/`. Each application manages its own dependencies, build tooling, and scripts via separate `package.json` files. There is no top-level orchestrator (no root `package.json`, Makefile, or Dockerfile); builds are executed per-subproject.

**Backend (NestJS API)**
- Build toolchain: Nest CLI (`nest build`) driven by `nest-cli.json`, which compiles TypeScript using the project's `tsconfig.json` and outputs to `dist/`. A dedicated `tsconfig.build.json` excludes tests and dev-only files from the production build.
- Prisma integration: schema generation (`prisma generate`) is a required step before lint/build/test in CI; migrations live under `API/prisma/migrations/` and are applied at runtime via `prisma migrate dev`.
- Scripts exposed: `build`, `start`, `start:dev`, `start:prod`, `lint`, `test`, `test:e2e`, `prisma:generate`, `prisma:migrate`, `prisma:studio`, `prisma:seed`.
- Testing: Jest configured in `API/package.json` with `ts-jest`, root dir `src`, test glob `*.spec.ts`, coverage output to `../coverage`.
- Linting/formatting: ESLint 9 with `typescript-eslint` and Prettier; run via `npm run lint --fix`.

**Frontend (React + Vite)**
- Build toolchain: Vite (`vite build`) preceded by TypeScript project references build (`tsc -b`). The root `tsconfig.json` uses `references` pointing to `tsconfig.app.json` and `tsconfig.node.json`.
- Scripts exposed: `dev` (Vite dev server), `build` (type-check + Vite production build), `lint`, `preview`.
- Styling: Tailwind CSS via `@tailwindcss/vite` plugin.
- State/data: TanStack Query for server state; React Router v7 for navigation.

**CI/CD (GitHub Actions)**
- Single workflow at `API/.github/workflows/ci.yml` runs on push/PR to `main`.
- Matrix strategy across Node.js 20.x and 22.x.
- Pipeline steps (all within `working-directory: API`): checkout → setup Node with npm cache → `npm ci` → `npx prisma generate` → `npm run lint` → `npm run build` → `npm test`.
- No deployment step is defined in this workflow; it validates build, lint, and tests only.

**Conventions & Constraints**
- Each subproject is self-contained with its own `package.json`; there is no npm/yarn workspaces configuration at the repo root.
- Prisma Client must be generated before any lint/build/test step in CI (enforced by the workflow).
- Production API startup uses `node -r tsconfig-paths/register dist/src/main.js` so path aliases resolve at runtime.
- Test files follow the `*.spec.ts` naming convention inside `src/`.
- E2E tests use a separate Jest config at `API/test/jest-e2e.json`.
- No Dockerfiles or docker-compose files are present in the repository (only an ignored `docker-compose.override.yml` reference exists).