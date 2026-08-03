---
kind: dependency_management
name: npm-based monorepo dependency management with lockfiles
category: dependency_management
scope:
    - '**'
source_files:
    - API/package.json
    - API/package-lock.json
    - package.json
    - package-lock.json
---

This repository uses npm as the package manager across two separate Node.js projects: a NestJS backend API under `API/` and a React/Vite frontend at the root. Each project maintains its own `package.json` and corresponding `package-lock.json` (lockfileVersion 3), ensuring deterministic installs.

**Backend (`API/package.json`)** — Declares NestJS framework dependencies (`@nestjs/*` packages v11.x), Prisma ORM (`@prisma/client`, `prisma` v7.9.1) with PostgreSQL adapter, authentication via `passport` + `passport-jwt` + `bcrypt`, validation through `class-validator`/`class-transformer`, Swagger/OpenAPI via `@nestjs/swagger`, and testing with Jest + Supertest. Dev tooling includes TypeScript, ESLint, Prettier, ts-node/tsconfig-paths for path resolution, and tsx for running scripts.

**Frontend (`package.json`)** — Uses React 19 with Vite 6 as the build tool, TanStack Query for data fetching, react-router-dom v7 for routing, i18next for internationalization, Tailwind CSS v4, Lucide icons, and Sonner for notifications. Development tooling includes TypeScript ~5.8.3, ESLint with React hooks rules, and Vite plugins.

**Lockfiles and versioning** — Both projects use caret (`^`) ranges in `package.json` to allow compatible updates, while `package-lock.json` pins exact resolved versions and integrity hashes from `https://registry.npmjs.org`. No vendoring strategy (no `node_modules` committed) and no private registry configuration is present; all packages are pulled from the public npm registry.

**Scripts and tooling** — The API exposes standard NestJS CLI commands plus Prisma-specific scripts (`prisma:generate`, `prisma:migrate`, `prisma:studio`, `prisma:seed`). The frontend provides dev/build/lint/preview scripts via Vite. There is no shared workspace or monorepo tool (no `pnpm-workspace.yaml`, `yarn.lock`, `lerna.json`, or `package.json` workspaces field), so each directory is an independent npm project.