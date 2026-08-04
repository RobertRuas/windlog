---
kind: dependency_management
name: Node.js Monorepo Dependency Management with npm Lockfiles
category: dependency_management
scope:
    - '**'
source_files:
    - API/package.json
    - API/package-lock.json
    - API/.github/workflows/ci.yml
    - package.json
    - .gitignore
    - API/.gitignore
---

The Windlog application is a Node.js monorepo consisting of two separate npm packages — a NestJS backend in `API/` and a React/Vite frontend in `src/` — each managing its own dependencies independently via `package.json` files. There is no shared workspace manager (no `package.json` at the repository root, no `pnpm-workspace.yaml`, no Lerna/Nx configuration), so each subproject declares its own dependency graph.

**Package managers and lockfiles**
- The backend (`API/package.json`) uses npm as its package manager and ships a committed `API/package-lock.json` (lockfileVersion 3) to pin exact transitive resolutions for reproducible installs.
- The CI pipeline (`API/.github/workflows/ci.yml`) enforces `npm ci` during installation, which reads the lockfile and guarantees deterministic builds across environments. It also caches the npm cache keyed on `API/package.json`.
- The frontend has a `package.json` but no committed lockfile; `node_modules/` is ignored globally via `.gitignore`.

**Dependency versioning strategy**
- Backend dependencies use caret ranges (`^11.0.1`, `^7.9.1`, etc.) allowing minor/patch updates within the specified major version.
- Frontend dependencies similarly use caret ranges (`^19.1.0`, `^5.101.4`, etc.).
- TypeScript versions are pinned more tightly: `~5.8.3` for the frontend and `^5.7.3` for the backend.

**Vendoring and private registries**
- No vendoring directory exists; `node_modules/` is excluded from version control in both `.gitignore` files.
- No `.npmrc`, `yarn.lock`, or `pnpm-lock.yaml` files are present, indicating reliance on the default public npm registry without private registry overrides or authentication tokens configured at the repo level.

**Build-time vs runtime dependencies**
- Both projects clearly separate runtime (`dependencies`) and development (`devDependencies`) packages. The backend includes Prisma tooling (`@prisma/client`, `prisma`) as runtime dependencies alongside dev tooling, while the frontend keeps build tools (Vite, TypeScript, ESLint, Tailwind) under `devDependencies`.

**CI-enforced constraints**
- The GitHub Actions workflow runs against Node.js 20.x and 22.x matrices, requiring dependencies to be compatible with both versions.
- The pipeline executes lint, build, and test steps after `npm ci`, making dependency resolution failures visible early in the PR process.