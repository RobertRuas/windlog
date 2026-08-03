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
    - API/package.json
---

The backend API uses NestJS's `@nestjs/config` package as its configuration system, centered around a fail-fast environment variable validation approach. The system loads `.env` files and validates all required variables at application startup before the server begins listening.

**Core Architecture:**
- Configuration is loaded via `ConfigModule.forRoot()` in `app.module.ts` with `isGlobal: true`, making it available across all modules without re-importing
- A dedicated `EnvironmentVariables` class in `src/config/env.validation.ts` defines all expected environment variables with `class-validator` decorators for type checking and constraint validation
- The bootstrap process in `main.ts` retrieves configuration through `ConfigService` for runtime access

**Validation Strategy:**
The system employs a dual-layer validation approach:
1. Schema-level validation using `class-validator` decorators (`@IsString()`, `@IsNotEmpty()`, `@IsNumber()`, `@IsEnum()`, `@Min()`) on the `EnvironmentVariables` class properties
2. Runtime validation in `app.module.ts` that explicitly checks for critical variables like `DATABASE_URL` and `JWT_SECRET`, throwing errors if missing

**Environment Variables Defined:**
- Database: `DATABASE_URL` (required)
- Server: `PORT` (default 3000), `NODE_ENV` (enum: development/production/test/staging)
- JWT: `JWT_SECRET` (required), `JWT_EXPIRES_IN` (default '7d'), `JWT_REFRESH_EXPIRES_IN` (default '7d')
- Upload: `UPLOAD_DIR` (default './uploads'), `MAX_FILE_SIZE` (default 10485760 bytes), `FILE_TOKEN_TTL` (default 300 seconds)
- CORS: `CORS_ORIGIN` (used directly in main.ts with fallback to 'http://localhost:5173')

**Fail-Fast Principle:**
The configuration system follows a strict fail-fast pattern — if any required environment variable is missing or invalid, the application throws an error during startup rather than failing at runtime. This ensures configuration issues are caught immediately during deployment.

**Mixed Access Patterns:**
While most configuration should be accessed through `ConfigService`, some modules bypass this pattern and read directly from `process.env` (notably `CORS_ORIGIN` in main.ts and upload-related variables in controllers). This represents an inconsistency in the configuration access pattern across the codebase.