---
kind: build_system
name: Build System — NestJS API + Vite React Frontend with Prisma and GitHub Actions CI
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
---

This repository is a monorepo-style project composed of two independently built sub-projects: a NestJS backend API under `API/` and a Vite + React frontend under `src/`. There is no top-level build orchestrator; each side has its own package manager, TypeScript configuration, and build pipeline.

### Backend (API) — NestJS + Prisma
- **Build tooling**: The Nest CLI (`@nestjs/cli`) drives compilation via `nest build`, which compiles TypeScript using the project's `tsconfig.json` and outputs to `dist/src/`. A separate `tsconfig.build.json` excludes tests and dev files from production builds.
- **Prisma integration**: Database schema lives in `prisma/schema.prisma` with migrations stored under `prisma/migrations/`. Prisma v7 uses an external `prisma.config.ts` to configure the CLI datasource URL via `DATABASE_URL` environment variable. Code generation (`prisma generate`) and migration commands are exposed through npm scripts (`prisma:generate`, `prisma:migrate`, `prisma:seed`, `prisma:studio`).
- **Runtime entry**: Production runs `node -r tsconfig-paths/register dist/src/main.js` via the `start:prod` script.
- **Testing**: Jest is configured with `ts-jest` for `.spec.ts` files, coverage output goes to `../coverage`, and e2e tests use a separate `test/jest-e2e.json` config.
- **Linting/formatting**: ESLint (via `eslint.config.mjs`) and Prettier (`prettierrc`) are used for code quality.

### Frontend — Vite + React
- **Build tooling**: Vite (`vite build`) handles bundling, with TypeScript compilation performed first via `tsc -b` (project references). Development server runs via `vite`.
- **TypeScript**: Uses `typescript` ~5.8.3 with `@types/react` and `@types/react-dom` for type safety.
- **Styling**: Tailwind CSS integrated via `@tailwindcss/vite` plugin.
- **i18n**: `i18next` + `react-i18next` with locale JSON files under `src/i18n/locales/pt/`.

### CI/CD — GitHub Actions
- **Pipeline location**: `API/.github/workflows/ci.yml`
- **Triggers**: Runs on every push to `main` and every pull request targeting `main`.
- **Matrix strategy**: Executes against Node.js 20.x and 22.x simultaneously.
- **Steps**:
  1. Checkout code
  2. Setup Node.js with npm cache keyed off `API/package.json`
  3. Install dependencies (`npm ci`)
  4. Generate Prisma Client (`npx prisma generate`)
  5. Run lint (`npm run lint`)
  6. Build (`npm run build`)
  7. Run unit tests (`npm test`)
- No Dockerfile or containerization is present in this repository.

### Conventions and constraints
- Each sub-project manages its own dependencies and build lifecycle independently — there is no root `package.json` that coordinates both sides.
- The backend enforces a strict separation between development (`--watch`), debug (`--debug --watch`), and production (`dist/src/main.js`) runtime modes via distinct npm scripts.
- Prisma migrations are versioned and stored as SQL files under `prisma/migrations/`, with the migration lock file (`migration_lock.toml`) ensuring deterministic ordering.
- The CI pipeline requires all steps (lint → build → test) to pass before merging PRs into `main`.
- No cross-compilation targets or multi-platform builds are defined; everything targets Node.js on Linux (GitHub Actions `ubuntu-latest`).