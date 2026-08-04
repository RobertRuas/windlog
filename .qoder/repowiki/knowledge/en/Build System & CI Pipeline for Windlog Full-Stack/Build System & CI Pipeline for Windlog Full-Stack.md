---
kind: build_system
name: Build System & CI Pipeline for Windlog Full-Stack
category: build_system
scope:
    - '**'
source_files:
    - API/package.json
    - package.json
    - API/.github/workflows/ci.yml
    - API/nest-cli.json
    - API/tsconfig.build.json
    - API/prisma/schema.prisma
    - API/test/jest-e2e.json
    - API/eslint.config.mjs
    - API/.prettierrc
---

This project uses a dual-package build system with separate Node.js/npm toolchains for the NestJS API (under `API/`) and the React frontend (root `src/`), orchestrated through npm scripts and GitHub Actions CI.

**Systems and tools used**
- **Backend**: NestJS CLI (`nest build`, `nest start`) with TypeScript compilation via `tsconfig.build.json`; Prisma ORM for schema generation and migrations; Jest for unit tests and Supertest for e2e tests.
- **Frontend**: Vite (`vite build`) with TypeScript (`tsc -b`) as the pre-step; ESLint + Prettier for linting/formatting.
- **CI**: GitHub Actions workflow at `API/.github/workflows/ci.yml` runs on push/PR to `main`, matrix-testing Node 20.x and 22.x.

**Key files and where they live**
- `API/package.json` — backend scripts: `build`, `start:prod`, `test`, `test:e2e`, `prisma:generate`, `prisma:migrate`, `prisma:seed`, `lint`.
- `package.json` (root) — frontend scripts: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`.
- `API/nest-cli.json` — Nest build config pointing at `tsconfig.json` and deleting `dist` on rebuild.
- `API/tsconfig.build.json` — production TS config excluding tests and `node_modules`.
- `API/prisma/schema.prisma` — single source of truth for database schema, enums, and relations; client generated to `./generated/prisma`.
- `API/test/jest-e2e.json` — e2e test runner configuration.
- `API/.github/workflows/ci.yml` — CI pipeline steps: checkout → setup Node (matrix 20/22) → `npm ci` → `prisma generate` → `npm run lint` → `npm run build` → `npm test`.
- `API/eslint.config.mjs` and `API/.prettierrc` — shared lint/format rules for the backend.

**Architecture and conventions**
- **Separate package roots**: The API and frontend are independent npm projects. There is no monorepo manager (no Nx, Turborepo, Lerna); each directory manages its own dependencies and build.
- **Nest build output**: `nest build` compiles TypeScript into `dist/src/` and the production entrypoint is `dist/src/main.js` (run via `node -r tsconfig-paths/register dist/src/main.js`).
- **Prisma-first data layer**: Schema changes flow through `prisma migrate dev` and `prisma generate`; the CI step explicitly runs `npx prisma generate` before lint/build so generated types are available.
- **Test separation**: Unit tests match `*.spec.ts` under `src/`; e2e tests match `.e2e-spec.ts` under `test/` with a separate Jest config.
- **Frontend build chain**: `tsc -b` performs type-checking first, then `vite build` produces static assets ready for serving.

**Conventions and constraints enforced by the build**
- **Node version matrix**: CI validates against both Node 20.x and 22.x (`API/.github/workflows/ci.yml`, lines 39–41).
- **Dependency installation**: CI uses `npm ci` (locked install) rather than `npm install`.
- **Prisma client generation is mandatory**: Every CI run executes `npx prisma generate` before lint/build, ensuring generated types exist.
- **Lint must pass**: `npm run lint` is a required CI step; ESLint is configured with `@typescript-eslint/recommendedTypeChecked` and Prettier integration, making formatting errors fatal in CI.
- **Tests must pass**: Both unit (`npm test`) and e2e (`npm run test:e2e`) targets are defined; CI runs `npm test`.
- **Production build excludes tests**: `tsconfig.build.json` excludes `**/*spec.ts`, `test`, and `dist`, keeping production artifacts clean.
- **Source root convention**: Nest's `sourceRoot` is set to `src`; all module code lives under `API/src/modules/<feature>/` following Nest modular architecture.
- **No Dockerfile or containerization found**: There is no Dockerfile, docker-compose, or container registry configuration in the repository, so deployment packaging is not part of this repo's build surface.