---
kind: build_system
name: Build System — NestJS API + React/Vite Frontend with GitHub Actions CI
category: build_system
scope:
    - '**'
source_files:
    - API/package.json
    - API/nest-cli.json
    - API/tsconfig.build.json
    - API/prisma.config.ts
    - API/.github/workflows/ci.yml
    - package.json
    - tsconfig.json
    - tsconfig.node.json
---

This repository uses a dual-package build system: a NestJS backend in `API/` and a React SPA built with Vite at the repository root. Both sides are TypeScript-based, linted with ESLint, and formatted with Prettier.

**Backend (NestJS)**
- Build toolchain: `@nestjs/cli` (`nest build`) compiles TypeScript to `dist/`, driven by `nest-cli.json` which points to `tsconfig.json`. A separate `tsconfig.build.json` excludes tests and test files from the production build.
- Package scripts (`API/package.json`): `build`, `start`, `start:dev`, `start:prod`, `lint`, `test`, `test:e2e`, plus Prisma commands (`prisma:generate`, `prisma:migrate`, `prisma:studio`, `prisma:seed`).
- Database schema/migrations: Prisma v7 is configured via `prisma.config.ts` (schema path, migrations directory, datasource URL from `DATABASE_URL`). Schema lives in `prisma/schema.prisma` with timestamped migration SQL under `prisma/migrations/`.
- Testing: Jest (`jest` config embedded in `package.json`) runs unit tests matching `*.spec.ts` under `src/`; e2e tests live in `test/` with a separate `jest-e2e.json`.
- Linting/formatting: ESLint 9 (`eslint.config.mjs`) with TypeScript support; Prettier for formatting.

**Frontend (React + Vite)**
- Build toolchain: Vite 6 with `@vitejs/plugin-react`. The root `package.json` script `build` runs `tsc -b && vite build`, using a project-references setup split across `tsconfig.app.json` and `tsconfig.node.json` (the root `tsconfig.json` only declares references).
- Scripts: `dev` (Vite dev server), `build` (type-check then bundle), `lint`, `preview`.
- Dependencies include React 19, TanStack Query, react-router-dom, i18next, TailwindCSS v4, and Sonner for toasts.

**CI Pipeline (GitHub Actions)**
- Defined in `API/.github/workflows/ci.yml`. Triggers on push/PR to `main`. Runs on Ubuntu with a Node.js matrix (20.x and 22.x). Steps: checkout → setup Node with npm cache keyed off `API/package.json` → `npm ci` → `npx prisma generate` → `npm run lint` → `npm run build` → `npm test`. No Docker image build or deployment step is present in this workflow.

**Conventions & Constraints**
- The API is marked `private: true` and versioned at `0.0.1`; the frontend is also private at `0.1.0`.
- Environment variables are loaded via `dotenv` (Prisma CLI) and validated through `src/config/env.validation.ts` at runtime.
- The CI caches `node_modules` using `cache-dependency-path: API/package.json` so dependency changes trigger fresh installs.
- There is no Makefile, Dockerfile, docker-compose, or release/publish pipeline found in the repository.