---
kind: configuration_system
name: NestJS Environment & Configuration System
category: configuration_system
scope:
    - '**'
source_files:
    - API/src/config/env.validation.ts
    - API/src/app.module.ts
    - API/src/main.ts
    - API/prisma.config.ts
---

The application uses a layered configuration system built on NestJS's `@nestjs/config` module with strict environment variable validation and dotenv-based loading.

**Core Framework: @nestjs/config + class-validator**
- `ConfigModule.forRoot()` is registered globally in `app.module.ts`, making configuration available across all modules without re-importing.
- Validation is performed via a dedicated `EnvironmentVariables` class in `src/config/env.validation.ts` using `class-validator` decorators (`IsString`, `IsNotEmpty`, `IsNumber`, `IsEnum`, `Min`, `IsOptional`).
- The validation runs at startup — missing or invalid variables cause an immediate fail-fast error before the server starts.

**Environment Variables Defined**
- Database: `DATABASE_URL` (required)
- Server: `PORT` (default 3000), `NODE_ENV` (enum: development/production/test/staging, default development)
- JWT: `JWT_SECRET` (required), `JWT_EXPIRES_IN` (default '7d'), `JWT_REFRESH_EXPIRES_IN` (default '7d')
- Upload: `UPLOAD_DIR` (default './uploads'), `MAX_FILE_SIZE` (default 10485760 bytes), `FILE_TOKEN_TTL` (default 300 seconds)
- CORS: `CORS_ORIGIN` (fallback `http://localhost:5173`)

**Loading Strategy**
- `.env` files are loaded automatically by `@nestjs/config` (dotenv integration).
- Prisma CLI tooling uses `dotenv/config` directly in `prisma.config.ts` and scripts like `seed.ts`, `fix-duplicates.ts`, and `sync-notifications.ts` to access `DATABASE_URL`.
- Some legacy code still reads `process.env.*` directly (e.g., `CORS_ORIGIN`, `UPLOAD_DIR`, `MAX_FILE_SIZE`) instead of going through `ConfigService`, which bypasses the validation layer.

**Validation Enforcement**
- A secondary inline validation in `app.module.ts` explicitly checks for required variables `DATABASE_URL` and `JWT_SECRET`, throwing descriptive errors if missing.
- The `EnvironmentVariables` class provides type-safe defaults and constraints for optional variables.

**Secrets Management**
- `.env`, `.env.local`, and `.env.production` are gitignored at both root and API levels.
- No secret rotation or external secret store (Vault, AWS Secrets Manager) is implemented — secrets are expected to be provided via environment variables only.

**Configuration Access Patterns**
- Preferred: Inject `ConfigService` from `@nestjs/config` into services/modules.
- Observed inconsistency: Several controllers read `process.env.*` directly, bypassing the centralized config layer.