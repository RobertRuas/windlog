---
kind: build_system
name: Build System & CI Pipeline for Windlog Full-Stack App
category: build_system
scope:
    - '**'
source_files:
    - API/package.json
    - API/nest-cli.json
    - API/tsconfig.build.json
    - API/prisma.config.ts
    - API/.github/workflows/ci.yml
    - package.json
---

The Windlog project uses a dual-package build system with separate build pipelines for the NestJS backend (API/) and the React/Vite frontend (src/), orchestrated through npm scripts and GitHub Actions CI.

**Backend Build (NestJS)**
- The API is built using `nest build` (via `@nestjs/cli`) which compiles TypeScript to JavaScript in the `dist/` directory. The build configuration extends `tsconfig.json` via `tsconfig.build.json`, excluding test files, `node_modules`, `test`, and `dist` from compilation.
- Prisma v7 is configured through a dedicated `prisma.config.ts` file that separates CLI configuration (migrations, generate) from runtime client configuration. Database URL is read from environment variables via `env('DATABASE_URL')`.
- Development builds use `nest start --watch`, production runs execute compiled output via `node -r tsconfig-paths/register dist/src/main.js`.
- Testing uses Jest with ts-jest transformer, configured to run `.spec.ts` files under `src/` with coverage collection to `../coverage`.

**Frontend Build (React + Vite)**
- Frontend uses Vite as the build tool with TypeScript compilation via `tsc -b` before `vite build`. Development server runs via `vite dev`.
- The build pipeline produces optimized static assets for deployment.

**CI/CD Pipeline (GitHub Actions)**
- Located at `API/.github/workflows/ci.yml`, the pipeline triggers on push and pull requests to the `main` branch.
- Runs on Ubuntu with Node.js matrix strategy (20.x and 22.x).
- Sequential steps: checkout → setup Node.js with npm caching → install dependencies (`npm ci`) → generate Prisma Client → lint → build → run tests.
- No Docker or containerization is present despite docker-compose references in .gitignore.

**Key Conventions**
- All build artifacts go to `dist/` for backend, standard Vite build output for frontend.
- Environment variables are managed through `.env` files (ignored from git) with `.env.example` as template.
- Prisma migrations are stored in version-controlled `prisma/migrations/` directory.
- Code quality enforced through ESLint and Prettier configurations.
- No Makefile, shell scripts, or custom build tools — pure npm script orchestration.