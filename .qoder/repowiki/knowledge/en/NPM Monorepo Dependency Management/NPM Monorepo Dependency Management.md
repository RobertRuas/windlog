---
kind: dependency_management
name: NPM Monorepo Dependency Management
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

This repository uses a dual-package npm-based dependency management strategy across two separate Node.js applications — a NestJS backend in `API/` and a React frontend at the root — with no shared workspace manager (no npm workspaces, pnpm monorepo, or Turborepo). Each package manages its own dependencies independently.

**Package managers and lockfiles**
- Both the frontend (`package.json`) and backend (`API/package.json`) use npm as the package manager, evidenced by the presence of `package-lock.json` files at both levels. The CI workflow explicitly runs `npm ci`, confirming npm is the enforced installer in CI.
- Lockfile version 3 is used throughout, pinning exact transitive dependency versions for reproducible installs.
- No `.npmrc` file was found at the repository root or under `API/`, so there is no custom registry, private package authentication, or npm configuration beyond defaults.

**Versioning strategy**
- Dependencies are declared with caret ranges (`^x.y.z`) in both `package.json` files, allowing minor and patch updates while preventing major-version breaks. This applies to all runtime and dev dependencies in both packages.
- TypeScript is pinned with tilde ranges (`~5.8.3` in the frontend) for tighter patch-level control on tooling that must stay compatible.

**CI-enforced installation**
- The GitHub Actions workflow (`API/.github/workflows/ci.yml`) installs dependencies via `npm ci` in the `API/` directory, which enforces lockfile fidelity and fails if the lockfile is out of sync. It also caches npm dependencies keyed off `API/package.json`.
- The matrix strategy tests against Node.js 20.x and 22.x, ensuring dependency compatibility across supported runtimes.

**No vendoring or local overrides**
- There is no `node_modules/` committed to the repository, no `vendor/` directory, and no `overrides` or `resolutions` fields in either `package.json`. Dependencies are always fetched from the public npm registry at install time.
- Prisma client generation (`prisma generate`) is treated as a build step rather than a dependency artifact; generated code lives under `API/prisma/generated/` and is not committed.

**Scripts as dependency lifecycle hooks**
- Backend scripts include `prisma:generate`, `prisma:migrate`, `prisma:studio`, and `prisma:seed`, integrating Prisma CLI into the dependency/build lifecycle.
- Frontend scripts cover development (`dev`), build (`build` with `tsc -b` before Vite), linting, and preview.

**Key constraints observed**
- CI will fail if `package-lock.json` drifts from `package.json` because `npm ci` is used.
- Only the `API/` package has an active CI pipeline defined; the frontend has no CI step shown, though it follows the same npm conventions.