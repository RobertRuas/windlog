---
kind: configuration_system
name: NestJS ConfigModule with Environment Validation
category: configuration_system
scope:
    - '**'
source_files:
    - API/src/config/env.validation.ts
    - API/src/app.module.ts
    - API/src/main.ts
    - API/prisma/schema.prisma
---

The Windlog application uses NestJS's `@nestjs/config` package as its central configuration system, combining `.env` file loading with strict runtime validation via `class-validator` decorators.

**System Architecture**
- Configuration is bootstrapped through `ConfigModule.forRoot()` in `app.module.ts`, marked as global so all modules can inject `ConfigService` without re-importing.
- The `EnvironmentVariables` class in `API/src/config/env.validation.ts` defines the complete schema of required and optional environment variables using `class-validator` decorators (`@IsString`, `@IsNotEmpty`, `@IsNumber`, `@IsEnum`, `@Min`, `@IsOptional`).
- A dual-layer validation approach is used: `ConfigModule.validate` enforces that critical variables like `DATABASE_URL` and `JWT_SECRET` exist, while the `EnvironmentVariables` class provides type-safe access to all config values.
- The bootstrap process in `main.ts` retrieves configuration via `ConfigService.get()` for runtime values like `PORT` and `NODE_ENV`, while some legacy code still reads directly from `process.env` (e.g., `CORS_ORIGIN`, `UPLOAD_DIR`, `MAX_FILE_SIZE`).

**Supported Environment Variables**
- Database: `DATABASE_URL` (required)
- Server: `PORT` (default 3000), `NODE_ENV` (development|production|test|staging)
- JWT: `JWT_SECRET` (required), `JWT_EXPIRES_IN` (default '7d'), `JWT_REFRESH_EXPIRES_IN` (default '7d')
- Uploads: `UPLOAD_DIR` (default './uploads'), `MAX_FILE_SIZE` (default 10485760 bytes), `FILE_TOKEN_TTL` (default 300 seconds)
- CORS: `CORS_ORIGIN` (fallback to http://localhost:5173)

**Conventions and Constraints**
- Fail-fast principle: missing or invalid required variables prevent the application from starting, documented explicitly in Portuguese comments within `env.validation.ts`.
- All environment variable names are uppercase snake_case following Node.js conventions.
- Optional variables have sensible defaults defined as class property initializers.
- The Prisma database URL is configured separately in `prisma.config.ts` (referenced in schema.prisma comments) rather than embedded in the schema file.
- Direct `process.env` access exists alongside `ConfigService` usage, indicating a migration pattern where new code should prefer `ConfigService` while legacy upload controllers still read `process.env['UPLOAD_DIR']` and `process.env['MAX_FILE_SIZE']` directly.