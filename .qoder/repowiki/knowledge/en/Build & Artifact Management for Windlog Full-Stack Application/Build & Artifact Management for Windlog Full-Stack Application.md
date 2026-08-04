---
kind: build_system
name: Build & Artifact Management for Windlog Full-Stack Application
category: build_system
scope:
    - '**'
source_files:
    - API/package.json
    - API/nest-cli.json
    - API/tsconfig.json
    - API/tsconfig.build.json
    - API/prisma.config.ts
    - API/.github/workflows/ci.yml
    - package.json
    - API/.gitignore
---

The Windlog project uses a dual-stack build system with separate toolchains for the NestJS backend (API/) and the React/Vite frontend (src/), orchestrated through npm scripts and GitHub Actions CI.

**Backend Build System (NestJS)**
The API is built using the NestJS CLI (`@nestjs/cli`) with TypeScript compilation configured via `tsconfig.json` and `tsconfig.build.json`. The `nest-cli.json` defines the source root as `src`, output directory as `dist`, and enables declaration file generation. The build pipeline compiles TypeScript to ES2023 JavaScript with Node.js module resolution, strict type checking enabled, and path aliases (`@common/*`, `@config/*`, `@modules/*`). Prisma v7 is integrated through `prisma.config.ts` which separates CLI configuration from runtime, managing database migrations in `prisma/migrations/` and generating typed clients. Development workflows include hot-reload via `nest start --watch`, debugging with `--debug --watch`, and database operations through `prisma migrate dev`, `prisma generate`, and `prisma studio`.

**Frontend Build System (React/Vite)**
The frontend uses Vite 6.x with React support, TypeScript compilation via `tsc -b` (project references), and Tailwind CSS integration. The build process first runs TypeScript compilation then Vite bundling, producing optimized static assets. Development server supports hot module replacement, while production builds generate minified bundles with source maps.

**CI/CD Pipeline**
GitHub Actions workflow (`API/.github/workflows/ci.yml`) implements continuous integration on push and pull requests to the main branch. The pipeline runs across Node.js versions 20.x and 22.x using matrix strategy, executing dependency installation with `npm ci`, Prisma client generation, ESLint validation, TypeScript compilation, and Jest test execution. Caching is configured for npm dependencies to speed up subsequent runs.

**Testing Infrastructure**
Backend testing uses Jest with ts-jest transformer, configured to run unit tests matching `*.spec.ts` patterns within the `src` directory, with coverage collection outputting to `../coverage`. E2E tests are separated via `test/jest-e2e.json`. Frontend testing setup appears minimal based on available configuration.

**Environment & Configuration Management**
Both stacks use environment variables managed through `.env` files (excluded from version control). The backend validates environment variables at startup using `class-validator` decorators. Prisma v7 configuration is split between `prisma.config.ts` for CLI operations and runtime configuration in the application code.

**Artifact Structure**
Backend builds produce compiled JavaScript in `dist/src/` with generated Prisma client types. Frontend builds create optimized static assets in Vite's default output directory. Both systems exclude development artifacts, test files, and node_modules from production builds.