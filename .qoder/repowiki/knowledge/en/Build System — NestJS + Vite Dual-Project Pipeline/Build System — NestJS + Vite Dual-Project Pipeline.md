---
kind: build_system
name: Build System — NestJS + Vite Dual-Project Pipeline
category: build_system
scope:
    - '**'
source_files:
    - API/package.json
    - API/nest-cli.json
    - API/tsconfig.json
    - API/tsconfig.build.json
    - .github/workflows/ci.yml
    - package.json
---

The Windlog project uses a dual-package build system with separate toolchains for the backend (NestJS) and frontend (React/Vite), orchestrated through npm scripts and GitHub Actions CI.

**Backend (API/)**
- Built with the NestJS CLI (`nest build`) which compiles TypeScript via `tsconfig.build.json` (extends `tsconfig.json`, excludes tests and dev files). Output goes to `dist/` with source maps enabled.
- Prisma is integrated: client generation via `prisma generate`, migrations via `prisma migrate dev`, seeding via `tsx prisma/seed.ts`, and schema management through `schema.prisma`.
- Testing uses Jest (`jest --watch`, coverage, e2e config in `test/jest-e2e.json`). Linting uses ESLint 9 with TypeScript support; formatting uses Prettier.
- Development server: `nest start --watch`; production run: `node -r tsconfig-paths/register dist/src/main.js`.

**Frontend (root)**
- Built with Vite (`vite build`) after TypeScript type-checking via `tsc -b`. Uses React 19, Tailwind CSS v4, TanStack Query, and i18next.
- Development server: `vite`; preview: `vite preview`.

**CI/CD (.github/workflows/ci.yml)**
- GitHub Actions pipeline triggers on push/PR to `main`.
- Matrix strategy runs Node.js 20.x and 22.x.
- Steps: checkout → setup Node with npm cache → `npm ci` → `npx prisma generate` → `npm run lint` → `npm run build` → `npm test`.
- All commands execute within the `API/` working directory.

**Conventions**
- Both projects use ES modules (`"type": "module"`).
- Backend path aliases: `@common/*`, `@config/*`, `@modules/*` mapped to `src/common|config|modules/*`.
- Strict TypeScript settings enforced across both projects.
- No Dockerfile or Makefile found; deployment artifacts are the compiled `dist/` directories.