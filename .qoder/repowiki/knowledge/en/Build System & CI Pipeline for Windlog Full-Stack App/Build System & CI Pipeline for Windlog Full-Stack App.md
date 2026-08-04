---
kind: build_system
name: Build System & CI Pipeline for Windlog Full-Stack App
category: build_system
scope:
    - '**'
source_files:
    - API/.github/workflows/ci.yml
    - API/package.json
    - API/nest-cli.json
    - API/tsconfig.build.json
    - API/prisma.config.ts
    - package.json
---

The Windlog project is a full-stack application composed of two independently built subprojects: a NestJS API under `API/` and a React+Vite frontend at the repository root. Each subproject manages its own build tooling, with a shared GitHub Actions CI pipeline orchestrating both.

**NestJS API Build (API/)**
- The API uses the NestJS CLI (`nest-cli.json`) configured to compile from `src/` into `dist/`, deleting the output directory on each build. TypeScript compilation is driven by `tsconfig.build.json`, which extends the base `tsconfig.json` and excludes test files, `node_modules`, `dist`, and `**/*spec.ts`.
- Dependencies are managed via npm (`package-lock.json`). Scripts in `API/package.json` define `build` (`nest build`), `start:prod` (`node -r tsconfig-paths/register dist/src/main.js`), linting, and testing via Jest.
- Database schema and migrations are handled by Prisma v7, configured through `prisma.config.ts` (separate from `schema.prisma` per Prisma v7 conventions). The Prisma Client is generated via `npx prisma generate` before build/test.
- No Dockerfile or docker-compose file is present in the repo; only `docker-compose.override.yml` is gitignored, indicating containerization is expected but not committed.

**Frontend Build (root `package.json`)**
- The React frontend is built with Vite and TypeScript. The `build` script runs `tsc -b && vite build`, first type-checking the entire project then producing optimized static assets.
- Development uses `vite dev`; preview uses `vite preview`. Linting is delegated to ESLint.

**CI Pipeline (GitHub Actions)**
- `API/.github/workflows/ci.yml` defines a single job that runs on push and pull requests to `main`. It checks out code, sets up Node.js across a matrix of versions (20.x and 22.x), installs dependencies with `npm ci`, generates the Prisma Client, runs lint, builds the API, and executes tests. All steps execute within the `API/` working directory.
- There is no separate CI configuration for the frontend; the frontend build is not part of the current CI pipeline.

**Conventions and Constraints**
- Both subprojects use ES modules (`"type": "module"` in their `package.json`).
- Secrets and environment variables are excluded from version control via `.gitignore` (`.env`, `.env.local`, `.env.production`).
- Generated artifacts (`dist/`, `build/`, `prisma/generated/`, `coverage/`, `uploads/`) are all gitignored.
- The CI enforces multi-version Node.js compatibility (20.x and 22.x) and requires passing lint, build, and test stages before merging.