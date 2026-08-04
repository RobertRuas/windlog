---
kind: configuration_system
name: NestJS Configuration System with Environment Validation
category: configuration_system
scope:
    - '**'
source_files:
    - API/src/config/env.validation.ts
    - API/src/app.module.ts
    - API/src/main.ts
    - API/src/database/prisma.service.ts
    - API/src/modules/auth/auth.module.ts
    - API/src/modules/upload/upload.service.ts
    - API/.gitignore
---

The Windlog API uses NestJS's `@nestjs/config` package as its central configuration system, combined with `class-validator` for strict environment variable validation and a fail-fast startup strategy.

**What system/approach is used**
- **NestJS ConfigModule**: The primary configuration loader, registered globally in `app.module.ts` via `ConfigModule.forRoot({ isGlobal: true })`.
- **class-validator decorators**: A typed `EnvironmentVariables` class in `src/config/env.validation.ts` defines every required/optional env var with validation rules (`@IsString`, `@IsNotEmpty`, `@IsNumber`, `@IsEnum`, `@Min`, `@IsOptional`).
- **dotenv**: Loaded automatically by NestJS ConfigModule; `.env` files are explicitly gitignored at both root and `API/` levels.
- **Fail-fast validation**: Missing or invalid environment variables cause the application to throw an error during bootstrap rather than failing at runtime.

**Key files and packages**
- `API/src/config/env.validation.ts` — Typed schema defining all environment variables (DATABASE_URL, PORT, NODE_ENV, JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, UPLOAD_DIR, MAX_FILE_SIZE, FILE_TOKEN_TTL) with validation decorators.
- `API/src/app.module.ts` — Registers `ConfigModule.forRoot()` with a custom `validate` function that enforces required vars (`DATABASE_URL`, `JWT_SECRET`) and returns the typed config.
- `API/src/main.ts` — Bootstraps the app, retrieves `ConfigService` to read `PORT` and `NODE_ENV`, and also reads `CORS_ORIGIN` directly from `process.env`.
- `API/src/database/prisma.service.ts` — Reads `DATABASE_URL` via `ConfigService.get<string>('DATABASE_URL')` to construct the Prisma PostgreSQL adapter.
- `API/src/modules/auth/auth.module.ts` — Uses `JwtModule.registerAsync` with `ConfigService` to inject `JWT_SECRET`, `JWT_EXPIRES_IN` into JWT options.
- `API/src/modules/upload/upload.controller.ts` and `upload.service.ts` — Read `UPLOAD_DIR`, `MAX_FILE_SIZE`, `FILE_TOKEN_TTL` via `ConfigService`.
- `API/.gitignore` — Explicitly excludes `.env`, `.env.local`, `.env.production`.
- `API/package.json` — Declares `dotenv` dependency.

**Architecture and conventions**
- Configuration is centralized through NestJS's dependency injection: modules import `ConfigModule` and inject `ConfigService` where needed.
- All environment variables are declared once in `EnvironmentVariables` class and validated at startup; there is no ad-hoc `process.env` access for core settings.
- Some legacy/direct `process.env` usage remains in `main.ts` for `CORS_ORIGIN` (with a fallback default).
- Prisma scripts (`seed.ts`, `fix-duplicates.ts`, `sync-notifications.ts`, `prisma.config.ts`) load `.env` via `import 'dotenv/config'` before accessing `process.env.DATABASE_URL`.
- Default values are provided inline in the validation class (e.g., `PORT = 3000`, `NODE_ENV = 'development'`, `JWT_EXPIRES_IN = '7d'`, `UPLOAD_DIR = './uploads'`, `MAX_FILE_SIZE = 10485760`, `FILE_TOKEN_TTL = 300`).

**Conventions and constraints**
- Required variables `DATABASE_URL` and `JWT_SECRET` must be present; otherwise the app throws `Missing required environment variable: <name>` during bootstrap.
- `NODE_ENV` must be one of `development`, `production`, `test`, or `staging` (enforced by `@IsEnum(NodeEnv)`).
- `MAX_FILE_SIZE` must be ≥ 1; `FILE_TOKEN_TTL` must be ≥ 60 (enforced by `@Min`).
- `.env` files are never committed — enforced by `.gitignore` entries in both repository root and `API/` directory.
- New environment variables should be added to the `EnvironmentVariables` class with appropriate validators to maintain the fail-fast contract.