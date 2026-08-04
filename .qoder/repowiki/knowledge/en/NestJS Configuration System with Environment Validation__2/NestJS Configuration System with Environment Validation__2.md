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

The Windlog API uses a NestJS-based configuration system centered on `@nestjs/config` with strict environment variable validation via `class-validator`. The system follows a fail-fast approach, ensuring the application refuses to start if required configuration is missing or invalid.

**Core Architecture:**
- Configuration loading is handled by `ConfigModule.forRoot()` in `app.module.ts`, configured as global (`isGlobal: true`) so all modules can access it without re-importing
- Environment variables are validated through a dedicated `EnvironmentVariables` class in `API/src/config/env.validation.ts` using TypeScript decorators (`@IsString()`, `@IsNotEmpty()`, `@IsNumber()`, `@IsEnum()`, `@Min()`, `@IsOptional()`)
- The validation schema documents all supported environment variables with their types, defaults, and constraints

**Supported Environment Variables:**
- **Database**: `DATABASE_URL` (required string)
- **Server**: `PORT` (number, default 3000), `NODE_ENV` (enum: development/production/test/staging, default development)
- **JWT Authentication**: `JWT_SECRET` (required string), `JWT_EXPIRES_IN` (default '7d'), `JWT_REFRESH_EXPIRES_IN` (default '7d')
- **File Upload**: `UPLOAD_DIR` (default './uploads'), `MAX_FILE_SIZE` (min 1 byte, default 10MB), `FILE_TOKEN_TTL` (min 60 seconds, default 300)
- **CORS**: `CORS_ORIGIN` (fallback to http://localhost:5173)

**Configuration Loading Pattern:**
- Primary configuration comes from `.env` files loaded automatically by `@nestjs/config`
- Some controllers still access `process.env` directly for specific values like `UPLOAD_DIR`, `MAX_FILE_SIZE`, and `CORS_ORIGIN`, creating a mixed pattern between typed configuration and direct environment access
- The bootstrap process in `main.ts` retrieves configuration values through `ConfigService.get()` for port and environment detection

**Validation Strategy:**
- Fail-fast validation at startup prevents runtime errors from missing configuration
- Type coercion and validation ensure data integrity
- Optional fields have sensible defaults while required fields cause immediate startup failure
- Custom enum validation for `NODE_ENV` restricts valid environment values

**Integration Points:**
- Prisma database connection uses `DATABASE_URL` from configuration
- JWT authentication relies on `JWT_SECRET` and expiration settings
- File upload functionality uses `UPLOAD_DIR`, `MAX_FILE_SIZE`, and `FILE_TOKEN_TTL`
- CORS policy respects `CORS_ORIGIN` for cross-origin requests
- Swagger documentation is configured but not environment-dependent

**Limitations:**
- Inconsistent usage pattern: some parts use `ConfigService` while others access `process.env` directly
- No separate configuration files per environment (.env.development, .env.production)
- No configuration hot-reloading during development
- Limited to basic type validation without complex business rule validation