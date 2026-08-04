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

The Windlog API uses a layered configuration system built on NestJS's `@nestjs/config` package with strict environment variable validation and fail-fast startup behavior.

**Core Framework and Loading Mechanism**
The configuration system is centered around `ConfigModule.forRoot()` in `API/src/app.module.ts`, configured as global (`isGlobal: true`) so all modules can access it without re-importing. The module loads `.env` files automatically through the `dotenv` dependency (declared in `package.json`) and applies validation via a custom `validate` function that enforces required variables like `DATABASE_URL` and `JWT_SECRET`. If any required variable is missing, the application throws an error during bootstrap and refuses to start.

**Environment Variable Schema and Validation**
All environment variables are defined and validated through a dedicated `EnvironmentVariables` class in `API/src/config/env.validation.ts`. This class uses `class-validator` decorators to enforce types, constraints, and defaults:
- Required string variables: `DATABASE_URL`, `JWT_SECRET`
- Optional numeric variables with defaults: `PORT` (3000), `MAX_FILE_SIZE` (10485760 bytes), `FILE_TOKEN_TTL` (300 seconds)
- Optional string variables with defaults: `UPLOAD_DIR` ('./uploads'), `JWT_EXPIRES_IN` ('7d'), `JWT_REFRESH_EXPIRES_IN` ('7d')
- Enum-validated `NODE_ENV` restricted to development, production, test, or staging

**Configuration Access Patterns**
The codebase exhibits two distinct patterns for accessing configuration values:
1. **Preferred pattern**: Using `ConfigService.get()` from `@nestjs/config` (used in `main.ts` for PORT and NODE_ENV, and in upload service for FILE_TOKEN_TTL)
2. **Direct process.env access**: Several controllers directly read `process.env['UPLOAD_DIR']`, `process.env['MAX_FILE_SIZE']`, and `process.env['CORS_ORIGIN']` instead of using ConfigService, creating inconsistency in how configuration is consumed across the codebase

**Runtime Configuration Points**
- CORS origin is configured in `main.ts` with fallback to `http://localhost:5173`
- Global route prefix `/api/v1` is set at application bootstrap
- Body parser limits are set to 10mb for handling base64 image uploads
- Swagger/OpenAPI documentation is configured with bearer JWT authentication scheme
- Security headers are applied via Helmet with relaxed CSP directives for Swagger UI

**Architecture Decisions**
The configuration follows a fail-fast principle where invalid or missing environment variables cause immediate startup failure rather than runtime errors. The validation schema serves dual purposes: enforcing configuration correctness and documenting required environment variables. However, the inconsistent access patterns (mixing ConfigService and direct process.env) create maintenance challenges and potential drift between declared validations and actual usage.