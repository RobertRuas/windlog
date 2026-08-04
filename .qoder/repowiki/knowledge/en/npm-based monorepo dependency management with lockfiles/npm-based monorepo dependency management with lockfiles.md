---
kind: dependency_management
name: npm-based monorepo dependency management with lockfiles
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - API/package.json
    - API/package-lock.json
    - API/.gitignore
    - .gitignore
---

This repository is a full-stack TypeScript application split into two npm packages — a NestJS backend under `API/` and a React/Vite frontend at the root — each managed independently with npm as the package manager.

**Systems and tools used**
- **Package manager**: npm (no pnpm or Yarn usage detected; `.gitignore` entries for yarn/pnpm logs are present but unused).
- **Lockfiles**: Both packages use `package-lock.json` (lockfileVersion 3) to pin exact transitive dependency versions. The root `package.json` has no lockfile, indicating the frontend lives in the repo root without its own lockfile committed.
- **No vendoring**: `node_modules/` is listed in both `.gitignore` files (`API/.gitignore` and root `.gitignore`), so dependencies are installed from the registry rather than vendored.
- **Registry**: All dependencies resolve against the default public npm registry (`https://registry.npmjs.org`), as evidenced by the `resolved` URLs in `API/package-lock.json`. No private registries, `.npmrc`, or `package.json` `workspaces` field are configured.

**Key files**
- `package.json` (root, frontend): declares React 19, Vite 6, TanStack Query, i18next, Tailwind CSS, and related dev tooling.
- `API/package.json`: declares NestJS 11, Prisma 7, Passport/JWT, bcrypt, pg, class-validator, Swagger, Jest, and TypeScript 5.7.
- `API/package-lock.json`: fully pinned lockfile for the backend package.
- `API/.gitignore` and root `.gitignore`: exclude `node_modules/` and various lock/log artifacts.

**Architecture and conventions**
- Each subproject is an independent npm package with its own `package.json`; there is no monorepo tool (no `pnpm workspaces`, `yarn workspaces`, or `npm workspaces`).
- Dependencies are declared with caret (`^`) ranges in `dependencies` and `devDependencies`, allowing minor/patch updates while keeping major versions fixed.
- Build scripts are defined per-package: the frontend uses `vite build` and `tsc -b`; the backend uses `nest build`, `prisma generate/migrate`, and Jest for testing.
- Prisma schema (`API/prisma/schema.prisma`) drives database client generation via `@prisma/client` and `@prisma/adapter-pg`, treated as a runtime dependency of the API package.

**Constraints and rules observed**
- `node_modules/` must not be committed (enforced by `.gitignore` in both directories).
- Dependency versions are constrained by `^` semver ranges in `package.json` files; exact pins live only in `API/package-lock.json`.
- No workspace configuration exists, so each package is installed and built independently.