---
kind: dependency_management
name: NPM-based Monorepo Dependency Management
category: dependency_management
scope:
    - '**'
source_files:
    - API/package.json
    - API/package-lock.json
    - package.json
    - API/prisma/schema.prisma
---

The Windlog repository uses npm as the package manager across a multi-package structure with separate dependency manifests for the NestJS backend (API/) and React frontend (root/). Each package maintains its own `package.json` with explicit version ranges and a corresponding lockfile to ensure reproducible builds.

**Systems and tools used:**
- **npm** with `package-lock.json` for deterministic dependency resolution in both packages
- **Prisma** (`@prisma/client`, `prisma`) manages database schema dependencies and migrations
- **TypeScript** (`typescript`, `tsconfig-paths`) provides type-level dependency management across both packages
- No vendoring, private registries, or `.npmrc` configuration found — all packages resolve from the public npm registry

**Key files:**
- `API/package.json` — Backend dependencies: NestJS ecosystem (^11.x), Prisma client (^7.9.1), PostgreSQL driver, JWT/passport authentication, validation libraries
- `API/package-lock.json` — Lockfile pinning exact transitive dependency versions for the backend
- `package.json` (root) — Frontend dependencies: React 19, Vite 6, TanStack Query, i18next, Tailwind CSS, TypeScript ~5.8.3
- `API/prisma/schema.prisma` — Database schema defining Prisma model dependencies

**Architecture and conventions:**
- **Separate package boundaries**: The API and frontend are independent npm packages with no shared workspace configuration, suggesting they can be built and deployed independently
- **Version range strategy**: Both packages use caret ranges (`^`) for major/minor version flexibility while locking exact versions via lockfiles
- **No monorepo tooling**: No `pnpm-workspace.yaml`, `yarn.lock`, or root `package.json` workspaces — each package is self-contained
- **Development vs production separation**: Clear split between `dependencies` and `devDependencies` in both packages
- **Database-as-dependency**: Prisma models in `schema.prisma` act as a form of schema dependency management with migration history tracked in `prisma/migrations/`

**Constraints and enforcement:**
- Lockfiles are committed and must be kept in sync with `package.json` changes
- TypeScript strict mode and path mapping (`tsconfig-paths`) enforce module resolution consistency
- No `.npmrc` or private registry configuration exists, meaning all dependencies must come from the public npm registry
- No dependency update automation (no Dependabot, Renovate, or similar bot configuration visible)