---
kind: build_system
name: Build System — NestJS + Vite Monorepo with Prisma and GitHub Actions CI
category: build_system
scope:
    - '**'
source_files:
    - API/package.json
    - API/nest-cli.json
    - API/tsconfig.json
    - API/tsconfig.build.json
    - API/.github/workflows/ci.yml
    - API/prisma/schema.prisma
    - package.json
---

This repository is a co-located monorepo containing a NestJS backend (`API/`) and a React frontend (`src/`), each managed as independent npm projects with their own `package.json`, TypeScript configuration, and build tooling. There is no top-level orchestrator (no root `package.json` scripts that run both sides together); the two sides are built independently.

**Backend (NestJS)**
- Build tool: `nest build` via `@nestjs/cli`, configured through `API/nest-cli.json` (source root `src`, output to `dist`, deletes out dir on rebuild).
- TypeScript compilation: `tsconfig.json` uses `module: nodenext`, target `ES2023`, strict mode, path aliases `@common/*`, `@config/*`, `@modules/*`; a separate `tsconfig.build.json` excludes tests and dev files for production builds.
- Database schema & migrations: Prisma v7 (`prisma/schema.prisma`) is the single source of truth; client generation is `npx prisma generate`, migrations via `prisma migrate dev`, seeding via `tsx prisma/seed.ts`. The generated client is emitted to `./generated/prisma` (not `node_modules`).
- Testing: Jest (`jest` in `package.json`) with `ts-jest` transformer, test files matching `*.spec.ts`, coverage collected under `../coverage`, e2e tests configured via `test/jest-e2e.json`.
- Linting/formatting: ESLint 9 (`eslint.config.mjs`) with `typescript-eslint`, Prettier (`prettier --write`), and `eslint-config-prettier` / `eslint-plugin-prettier`.
- Scripts exposed: `build`, `start`, `start:dev`, `start:debug`, `start:prod`, `lint`, `test`, `test:watch`, `test:cov`, `test:e2e`, `prisma:generate`, `prisma:migrate`, `prisma:studio`, `prisma:seed`.

**Frontend (React + Vite)**
- Build tool: Vite 6 (`vite build`) driven by `npm run build` in the root `package.json`, which first runs `tsc -b` (TypeScript project references) then `vite build`.
- Development: `vite` dev server, preview via `vite preview`.
- Linting: ESLint 9 with React hooks and refresh plugins.
- Dependencies include React 19, TanStack Query, i18next, Tailwind CSS v4, and Lucide icons.

**CI Pipeline (GitHub Actions)**
- Workflow file: `API/.github/workflows/ci.yml`.
- Triggers: push and pull_request events against `main`.
- Matrix strategy: Node.js 20.x and 22.x on `ubuntu-latest`.
- Steps: checkout → setup Node with npm cache keyed on `API/package.json` → `npm ci` → `npx prisma generate` → `npm run lint` → `npm run build` → `npm test`.
- No Dockerfile or containerization was found in the repository.

**Architecture & Conventions**
- Each side is an independent npm package with its own dependency graph; there is no shared workspace manager (pnpm/yarn workspaces, Nx, Turborepo, etc.).
- The Prisma schema is the canonical contract between backend and frontend types; the frontend communicates over typed REST APIs but does not import Prisma types directly.
- Path aliases in the backend (`@common`, `@config`, `@modules`) enforce a modular structure within NestJS modules.
- All timestamps use UTC; soft delete via `deletedAt` fields is a database convention enforced at the schema level.
- Versioning: backend `API/package.json` declares version `0.0.1`; frontend root `package.json` declares `0.1.0`. No automated release pipeline was found.