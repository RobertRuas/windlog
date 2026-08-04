---
kind: dependency_management
name: npm-based Monorepo Dependency Management with Lockfiles and CI Caching
category: dependency_management
scope:
    - '**'
source_files:
    - API/package.json
    - API/package-lock.json
    - package.json
    - API/.github/workflows/ci.yml
---

The Windlog project uses npm as the package manager across two separate Node.js applications — a NestJS API (`API/package.json`) and a React+Vite frontend (`package.json` at the repository root). Each application maintains its own `package.json` manifest and lockfile (`API/package-lock.json`), ensuring deterministic, reproducible installs. The CI pipeline in `API/.github/workflows/ci.yml` enforces `npm ci` for dependency installation, which reads from the lockfile to guarantee exact versions are installed during continuous integration.

Dependency versioning follows semantic ranges using caret (`^`) prefixes in both manifests, allowing minor/patch updates within major version boundaries. The API depends on NestJS ecosystem packages (NestJS core, JWT, Passport, Swagger), Prisma ORM with PostgreSQL adapter, bcrypt for hashing, class-validator/class-transformer for DTO validation, and standard utilities like uuid and rxjs. The frontend relies on React 19, TanStack Query, i18next for internationalization, TailwindCSS via Vite plugin, and Lucide icons.

There is no vendoring strategy — all dependencies are fetched from the public npm registry as indicated by the resolved URLs in the lockfile. No private registries, `.npmrc` configuration, or proxy settings are present in the repository. The CI workflow caches npm dependencies per Node.js version matrix (20.x and 22.x) using GitHub Actions' built-in cache mechanism keyed to `API/package.json`, improving build performance without requiring explicit lockfile pinning beyond what npm's lockfile already provides.

Prisma dependencies (`@prisma/client`, `prisma`, `@prisma/adapter-pg`) are treated as runtime dependencies in the API, with code generation performed explicitly via `npx prisma generate` in CI after dependency installation. TypeScript types for third-party libraries are managed through separate `@types/*` packages listed under devDependencies.