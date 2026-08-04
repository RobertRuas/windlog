---
kind: dependency_management
name: NPM Monorepo with Lockfiles and CI-Enforced Dependency Resolution
category: dependency_management
scope:
    - '**'
source_files:
    - API/package.json
    - API/package-lock.json
    - API/.github/workflows/ci.yml
    - package.json
---

This repository manages dependencies using npm across two separate Node.js projects: a NestJS API (`API/`) and a React frontend (`src/`). Each project maintains its own `package.json` with explicit dependency declarations, and the API project includes a `package-lock.json` (lockfileVersion 3) to pin exact transitive dependency versions. The frontend does not include a lockfile in the repository, relying on npm's default behavior.

**Package managers and tooling:**
- npm is the sole package manager used throughout the project.
- Dependencies are declared with caret (`^`) version ranges in both `package.json` files, allowing minor/patch updates within the specified major version.
- The API project uses `npm ci` in CI for deterministic installs from the lockfile, while the frontend has no lockfile committed.
- No vendoring strategy (e.g., `node_modules` exclusion via `.gitignore`) is used; dependencies are installed at runtime.
- No private registry configuration, `.npmrc`, or `GOPRIVATE` settings are present — all packages are resolved from the public npm registry.

**CI-enforced dependency workflow:**
The GitHub Actions pipeline (`API/.github/workflows/ci.yml`) enforces a strict dependency installation process:
1. Node.js setup with npm cache enabled, keyed by `API/package.json`
2. `npm ci` for lockfile-based deterministic installs
3. Prisma client generation before build/test steps
4. Linting, building, and testing against multiple Node.js versions (20.x, 22.x)

**Dependency organization patterns:**
- API dependencies are split between runtime (`dependencies`) and development (`devDependencies`), including NestJS ecosystem packages (@nestjs/*), Prisma client, authentication (passport-jwt, bcrypt), validation (class-validator, class-transformer), and testing tools (Jest, Supertest).
- Frontend dependencies follow a similar pattern with React 19, TanStack Query, i18next for internationalization, TailwindCSS v4, Vite as the build tool, and TypeScript.
- Both projects use TypeScript with type definitions declared as separate `@types/*` packages in devDependencies.
- No shared workspace configuration (no `package.json` workspaces field) — each project manages its own dependency tree independently.

**Constraints and conventions observed:**
- All dependencies use semver-compatible version ranges (^x.y.z) rather than exact pinning in `package.json`.
- The API project enforces reproducible builds through `package-lock.json` and `npm ci` in CI.
- Prisma dependencies (`@prisma/client`, `prisma`, `@prisma/adapter-pg`) are kept in sync across runtime and dev dependencies.
- No dependency audit scripts or security scanning tools are configured in the CI pipeline.