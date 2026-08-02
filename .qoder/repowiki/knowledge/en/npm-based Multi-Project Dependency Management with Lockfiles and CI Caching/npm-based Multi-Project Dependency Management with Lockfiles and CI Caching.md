---
kind: dependency_management
name: npm-based Multi-Project Dependency Management with Lockfiles and CI Caching
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - API/package.json
    - API/package-lock.json
    - API/.github/workflows/ci.yml
---

This repository manages dependencies using npm across two separate Node.js projects — a NestJS backend under `API/` and a React+Vite frontend at the repository root. Each project maintains its own `package.json` and an accompanying `package-lock.json` (lockfileVersion 3), ensuring deterministic, reproducible installs.

**Systems and tools used**
- **Package manager**: npm is the sole package manager; no pnpm, Yarn, or other managers are configured in this repo.
- **Lockfiles**: Both `package-lock.json` files are committed alongside their manifests, pinning exact dependency trees for every install.
- **CI-driven installation**: The GitHub Actions workflow (`API/.github/workflows/ci.yml`) runs `npm ci` inside the `API/` directory, which enforces lockfile fidelity during builds.
- **Dependency caching**: The CI step configures `cache: 'npm'` with `cache-dependency-path: API/package.json`, so npm caches node_modules between runs.
- **Prisma codegen**: The backend uses Prisma (`prisma generate`) as part of the build pipeline to derive TypeScript types from `schema.prisma`; Prisma itself is declared as a devDependency.

**Key files**
- `package.json` (root, frontend) — declares React, Vite, TanStack Query, i18next, Tailwind, ESLint, TypeScript, etc.
- `package-lock.json` (root) — lockfile for the frontend.
- `API/package.json` — declares NestJS ecosystem, Prisma client/adapter, Passport/JWT, bcrypt, pg, class-validator, Swagger, Jest, ts-node, etc.
- `API/package-lock.json` — lockfile for the backend.
- `API/.github/workflows/ci.yml` — CI pipeline that installs, generates Prisma, lints, builds, and tests using `npm ci`.

**Architecture and conventions**
- **Monorepo-style separation without a workspace tool**: The backend and frontend live side-by-side but are treated as independent npm projects, each with its own manifest and lockfile. There is no `package.json` workspaces configuration, no shared `node_modules`, and no cross-project dependency sharing.
- **Version ranges**: Dependencies use caret (`^`) ranges in both manifests, allowing minor/patch updates while keeping major versions pinned by convention. The lockfiles then resolve these to exact versions.
- **Dev vs runtime split**: Both projects clearly separate runtime `dependencies` from `devDependencies`, keeping production bundles lean.
- **No vendoring**: `node_modules` is not committed; dependencies are fetched from the public npm registry at install time.
- **No private registry or `.npmrc`**: No custom registry, token, or proxy configuration was found in the repository, indicating reliance on the default public npm registry.

**Enforced constraints**
- CI must run `npm ci` (not `npm install`) in the `API/` directory, which will fail if the lockfile drifts from `package.json`, enforcing lockfile consistency.
- The CI matrix targets Node.js 20.x and 22.x, constraining the supported runtime versions for dependency resolution.