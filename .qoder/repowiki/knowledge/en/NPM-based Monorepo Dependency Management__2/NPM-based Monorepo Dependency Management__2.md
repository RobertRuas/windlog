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
    - API/.github/workflows/ci.yml
    - API/.gitignore
    - .gitignore
---

This repository uses a dual-package structure with separate dependency management for the NestJS backend (API/) and React frontend (root/), both managed via npm with lockfiles.

**Package managers and manifests:**
- Backend: `API/package.json` declares NestJS ecosystem dependencies (@nestjs/*, @prisma/client, passport-jwt, pg) and dev tooling (jest, ts-node, prisma CLI). A `package-lock.json` is committed to enforce deterministic installs.
- Frontend: Root `package.json` declares React 19, Vite 6, TanStack Query, i18next, Tailwind CSS v4, and TypeScript ~5.8.3. No lockfile is present in the root directory.

**Lockfile strategy:**
- The API subproject commits `package-lock.json` (lockfileVersion 3), ensuring reproducible builds across environments.
- The frontend has no committed lockfile, meaning dependency resolution may vary between local and CI environments unless an external lockfile mechanism is used.

**CI-driven installation:**
- GitHub Actions (`API/.github/workflows/ci.yml`) runs `npm ci` in the API directory, using npm's cache keyed by `API/package.json`. The pipeline tests against Node.js 20.x and 22.x matrices.
- The workflow explicitly generates Prisma Client before lint/build/test steps.

**Node_modules handling:**
- Both `API/.gitignore` and root `.gitignore` exclude `node_modules/`, following standard npm conventions.
- Debug logs for npm, yarn, and pnpm are ignored (`*debug.log*`, `*error.log*`).

**No vendoring or private registry configuration:**
- There is no `vendor/` directory, no `.npmrc` with private registries, no `GOPRIVATE` equivalent, and no proxy or authentication configuration visible. Dependencies are resolved from the public npm registry.

**Key architectural decisions:**
- Separate package manifests per subproject enable independent versioning of backend and frontend dependencies.
- The API project enforces strict reproducibility via `npm ci` + committed lockfile, while the frontend relies on caret ranges (`^`) allowing minor/patch updates without manual intervention.