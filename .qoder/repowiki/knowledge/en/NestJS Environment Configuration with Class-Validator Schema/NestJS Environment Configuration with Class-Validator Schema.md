---
kind: configuration_system
name: NestJS Environment Configuration with Class-Validator Schema
category: configuration_system
scope:
    - '**'
source_files:
    - API/src/config/env.validation.ts
    - API/src/app.module.ts
    - API/src/main.ts
    - API/src/database/prisma.service.ts
    - API/prisma.config.ts
---

The Windlog backend uses a layered configuration system built on NestJS's `@nestjs/config` module, combining environment variable loading, schema-based validation, and centralized access through `ConfigService`.

**Core Framework and Loading Mechanism**
The application loads `.env` files automatically via `ConfigModule.forRoot()` in `app.module.ts`, which is configured as a global module (`isGlobal: true`) so all other modules can inject `ConfigService` without re-importing. The bootstrap process in `main.ts` also directly accesses `process.env` for early-stage configuration like CORS origin before the NestJS container is fully initialized.

**Schema-Based Validation with class-validator**
The central configuration schema is defined in `API/src/config/env.validation.ts` using the `EnvironmentVariables` class decorated with `class-validator` decorators (`@IsString`, `@IsNotEmpty`, `@IsNumber`, `@IsEnum`, `@Min`, `@IsOptional`). This provides type-safe validation of all environment variables at startup with fail-fast behavior — the application refuses to start if any required variable is missing or invalid. The validation class documents each variable's purpose, type, and default values inline.

**Environment Variables Defined**
- **Database**: `DATABASE_URL` (required string)
- **Server**: `PORT` (number, default 3000), `NODE_ENV` (enum: development/production/test/staging, default development)
- **JWT Authentication**: `JWT_SECRET` (required string), `JWT_EXPIRES_IN` (default '7d'), `JWT_REFRESH_EXPIRES_IN` (default '7d')
- **File Uploads**: `UPLOAD_DIR` (default './uploads'), `MAX_FILE_SIZE` (default 10MB), `FILE_TOKEN_TTL` (default 300 seconds)
- **CORS**: `CORS_ORIGIN` (used directly from `process.env` in main.ts)

**Prisma-Specific Configuration**
For Prisma v7+, database connection is split between runtime and CLI:
- Runtime: `PrismaService` reads `DATABASE_URL` via `ConfigService.get<string>('DATABASE_URL')` and creates a `PrismaPg` adapter
- CLI: `prisma.config.ts` uses `dotenv/config` and Prisma's `env()` helper for migration commands
- Scripts in `API/prisma/` seed data and run migrations by importing `dotenv/config` and reading `DATABASE_URL` directly from `process.env`

**Access Patterns**
- Services use `configService.get<T>()` for optional values with defaults
- Critical secrets use `configService.getOrThrow<T>()` to fail fast if missing
- Some legacy code still accesses `process.env['VARIABLE_NAME']` directly (particularly in upload controllers), creating inconsistency

**Conventions and Constraints**
- All new environment variables must be added to the `EnvironmentVariables` class with appropriate validators
- Required variables should throw errors during validation rather than having defaults
- The validation layer ensures type safety and prevents runtime errors from missing configuration
- Frontend configuration is separate (Vite environment variables) and not part of this system