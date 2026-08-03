---
kind: dependency_management
name: npm-based monorepo dependency management with lockfiles
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - API/package.json
    - package-lock.json
    - API/package-lock.json
    - API/prisma/schema.prisma
---

This repository is a full-stack TypeScript project split into two npm workspaces: a NestJS backend under `API/` and a React/Vite frontend at the root. Dependency management follows standard npm conventions across both sides.

**Systems and tools used**
- **npm** is the package manager for both the frontend and the API, declared via `package.json` files in each workspace.
- **Lockfiles**: `package-lock.json` exists in both the root (frontend) and `API/` directories, pinning exact resolved versions and integrity hashes for reproducible installs.
- **Prisma** is used as the database client and migration tool in the API; its own CLI (`prisma`) is listed as a devDependency and invoked through npm scripts (`prisma:generate`, `prisma:migrate`, `prisma:studio`, `prisma:seed`).
- No vendoring (no `node_modules` committed), no private registry configuration, and no `.npmrc` file was found — packages are resolved from the default public npm registry.

**Key files**
- `package.json` (root, frontend): declares React 19, Vite, Tailwind, i18next, react-query, and related dev tooling; build script runs `tsc -b && vite build`.
- `API/package.json`: declares NestJS 11 ecosystem, Prisma 7, PostgreSQL driver (`pg`), Passport/JWT auth, class-validator/transformer, testing (Jest + Supertest), and formatting/linting tooling; includes dedicated scripts for Prisma operations.
- `package-lock.json` (root and `API/`): lockfileVersion 3, ensuring deterministic installs across environments.
- `API/prisma/schema.prisma` and `API/prisma/migrations/`: schema-driven DB dependencies managed alongside code changes.

**Architecture and conventions**
- Each workspace manages its own dependency graph independently; there is no shared `node_modules` or workspace-level `package.json` that aggregates dependencies.
- Dependencies are pinned with caret ranges (`^x.y.z`) in `dependencies` and `devDependencies`, allowing minor/patch updates while keeping major versions stable.
- Development tooling (linters, formatters, type checkers, bundlers) is kept separate from runtime dependencies by placing them under `devDependencies`.
- The API uses NestJS modular architecture; each module imports only the libraries it needs (e.g., `@nestjs/jwt`, `multer`, `bcrypt`), avoiding unnecessary coupling.
- Database access goes exclusively through Prisma Client generated from `schema.prisma`; raw SQL is avoided except in migrations.

**Constraints and observed rules**
- Both workspaces use npm lockfiles, so CI and local installs should run `npm ci` to honor the pinned tree.
- No `.npmrc`, `yarn.lock`, `pnpm-lock.yaml`, or `bun.lock` files exist — npm is the sole package manager.
- No `vendor/` directory or vendored dependencies are present; all third-party code comes from npm.
- Prisma migrations live under `API/prisma/migrations/` and are versioned with timestamps, forming part of the source-of-truth for schema evolution.