---
kind: dependency_management
name: npm-based Monorepo Dependency Management with Lockfiles and CI Caching
category: dependency_management
scope:
    - '**'
source_files:
    - API/package.json
    - API/package-lock.json
    - .github/workflows/ci.yml
---

The Windlog repository uses npm as the package manager across a monorepo structure with two separate Node.js projects: a NestJS API under `API/` and a React frontend at the root `src/`. Each project maintains its own `package.json` and lockfile (`API/package-lock.json`) to pin exact dependency versions, ensuring reproducible builds. Dependencies are declared using caret ranges (e.g., `^11.0.1`) in both `dependencies` and `devDependencies` sections, allowing minor/patch updates while preventing major version drift.

The CI pipeline in `API/.github/workflows/ci.yml` enforces deterministic installs via `npm ci`, which reads from `package-lock.json` rather than `package.json`, guaranteeing that production builds match the committed lockfile. The workflow caches npm dependencies per Node.js version matrix (20.x, 22.x) using `cache-dependency-path: API/package.json` to speed up subsequent runs. Prisma client generation is explicitly run after dependency installation but before linting and building.

No vendoring strategy (node_modules is not committed), no private registry configuration, and no `.npmrc` file exists in the repository. The `.gitignore` includes patterns for various package managers (`yarn-debug.log*`, `pnpm-debug.log*`) suggesting awareness of alternative tools, but only npm is actively used. There is no automated dependency update tooling (like Dependabot or Renovate) visible in the repository structure.