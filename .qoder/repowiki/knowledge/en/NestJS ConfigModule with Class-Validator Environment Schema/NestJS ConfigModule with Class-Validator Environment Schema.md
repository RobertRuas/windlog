---
kind: configuration_system
name: NestJS ConfigModule with Class-Validator Environment Schema
category: configuration_system
scope:
    - '**'
source_files:
    - API/src/config/env.validation.ts
    - API/src/app.module.ts
    - API/src/main.ts
    - API/prisma.config.ts
    - API/package.json
---

The Windlog backend uses NestJS's `@nestjs/config` package as its central configuration system, layered on top of `.env` files and validated through a strict schema-based approach.

**Loading mechanism**
- `ConfigModule.forRoot()` is registered in `src/app.module.ts` with `isGlobal: true`, making configuration available across all modules without re-importing.
- The module automatically loads `.env` files via the built-in dotenv loader (no explicit `dotenv` import needed).
- A custom `validate` callback enforces that `DATABASE_URL` and `JWT_SECRET` are present at startup, failing fast if missing.

**Schema validation**
- `src/config/env.validation.ts` defines an `EnvironmentVariables` class decorated with `class-validator` decorators (`IsString`, `IsNotEmpty`, `IsNumber`, `IsEnum`, `Min`, `IsOptional`).
- Each property maps one-to-one to an expected environment variable, providing both type hints and runtime validation rules.
- Supported variables include: `DATABASE_URL`, `PORT` (default 3000), `NODE_ENV` (enum: development/production/test/staging), `JWT_SECRET`, `JWT_EXPIRES_IN` (default '7d'), `JWT_REFRESH_EXPIRES_IN` (default '7d'), `UPLOAD_DIR` (default './uploads'), `MAX_FILE_SIZE` (default 10485760), and `FILE_TOKEN_TTL` (default 300).

**Access patterns**
- Configuration is consumed via `ConfigService.get<T>(key, defaultValue)` throughout the app (e.g., `configService.get<number>('PORT', 3000)` in `main.ts`, `configService.get<string>('DATABASE_URL')` in `prisma.service.ts`).
- Some legacy code still reads directly from `process.env` (e.g., `CORS_ORIGIN` in `main.ts`, `UPLOAD_DIR`/`MAX_FILE_SIZE` in controllers), which bypasses the validation layer.

**Prisma integration**
- Prisma scripts (`seed.ts`, `fix-duplicates.ts`, `sync-notifications.ts`) load `.env` independently via `import 'dotenv/config'` and read `DATABASE_URL` directly from `process.env`.
- `prisma.config.ts` also imports dotenv and passes `env('DATABASE_URL')` to the Prisma client adapter.

**Frontend configuration**
- The React frontend does not use a dedicated config system; it relies on Vite's default environment variable handling (e.g., `VITE_*` variables) and hard-coded defaults like `http://localhost:5173` for CORS.

**Conventions and constraints**
- All new environment variables should be added to the `EnvironmentVariables` class with appropriate `class-validator` decorators.
- Required variables must throw descriptive errors when missing (enforced by the `validate` callback).
- Optional variables should provide sensible defaults via decorator defaults or `ConfigService.get` fallbacks.
- Direct `process.env` access is discouraged outside of bootstrapping and Prisma tooling.