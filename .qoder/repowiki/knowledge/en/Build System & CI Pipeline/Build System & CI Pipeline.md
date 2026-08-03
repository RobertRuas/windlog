---
kind: build_system
name: Build System & CI Pipeline
category: build_system
scope:
    - '**'
source_files:
    - API/package.json
    - package.json
    - API/.github/workflows/ci.yml
    - API/nest-cli.json
    - API/tsconfig.json
    - API/tsconfig.build.json
    - vite.config.ts
    - tsconfig.node.json
---

This repository uses a dual-package Node.js setup with separate build systems for the NestJS backend (API/) and the React/Vite frontend (root/), orchestrated through npm scripts and GitHub Actions CI.

**Backend (NestJS) build system:**
- Built via `nest build` (Nest CLI) which compiles TypeScript using `tsconfig.json` (ES2023 target, NodeNext module resolution, strict mode, path aliases `@common/*`, `@config/*`, `@modules/*`).
- A dedicated `tsconfig.build.json` extends the base config and excludes tests/spec files from production builds.
- Prisma client is generated separately via `npx prisma generate` before build/test.
- Production runtime uses `node -r tsconfig-paths/register dist/src/main.js` to resolve path aliases at runtime.
- Testing runs via Jest (`npm test`) configured in `package.json` with ts-jest transformer, rootDir `src`, and coverage output to `../coverage`.
- Linting uses ESLint 9 with TypeScript support; formatting via Prettier.

**Frontend (React + Vite) build system:**
- Development server: `vite dev` on port 5173 with Hot Module Replacement.
- Build pipeline: `tsc -b && vite build` — first type-checks with TypeScript project references, then bundles with Vite.
- Vite config includes React plugin, Tailwind CSS integration, `/api` proxy to `http://localhost:3000` for CORS-free development, and `@/` path alias pointing to `./src`.
- Uses ES modules (`"type": "module"`) and modern TS config (`tsconfig.node.json` with ES2022 target, bundler moduleResolution).

**CI/CD (GitHub Actions):**
- Workflow `.github/workflows/ci.yml` triggers on push/PR to `main` branch.
- Matrix strategy runs against Node.js 20.x and 22.x.
- Steps: checkout → setup Node with npm cache (keyed on `API/package.json`) → `npm ci` → `prisma generate` → `npm run lint` → `npm run build` → `npm test`.
- All steps execute in the `API/` working directory.

**Artifacts & outputs:**
- Backend compiled output goes to `dist/` (cleaned by `deleteOutDir: true` in nest-cli).
- Frontend build produces static assets via Vite's default output.
- Coverage reports written to `coverage/` in API root.
- Generated Prisma client excluded from version control (`prisma/generated/`).

**Environment & secrets management:**
- `.env`, `.env.local`, `.env.production` are gitignored; `.env.example` serves as template per comment in `.gitignore`.
- No Dockerfiles or docker-compose files are present in the repo (only `docker-compose.override.yml` is gitignored).
- No Makefile or shell-based build scripts found.