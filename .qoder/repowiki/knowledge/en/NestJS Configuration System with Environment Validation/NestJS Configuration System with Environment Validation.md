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
    - API/src/modules/auth/strategies/jwt.strategy.ts
---

The application uses NestJS's `@nestjs/config` package as its central configuration system, combining environment variable loading with strict runtime validation through a fail-fast pattern.

**Core Architecture**

Configuration is bootstrapped in `app.module.ts` via `ConfigModule.forRoot()` with `isGlobal: true`, making it available across all modules without re-importing. The module loads `.env` files automatically and applies validation through a dedicated `EnvironmentVariables` class in `API/src/config/env.validation.ts`. This class uses `class-validator` decorators (`@IsString`, `@IsNotEmpty`, `@IsNumber`, `@IsEnum`, `@Min`) to enforce type safety and constraints on every environment variable.

**Validation Strategy**

The system implements a dual-layer validation approach:
1. **Schema-level validation**: The `EnvironmentVariables` class defines all expected variables with their types and constraints (e.g., `DATABASE_URL` must be a non-empty string, `PORT` defaults to 3000, `NODE_ENV` must match the `NodeEnv` enum)
2. **Runtime enforcement**: A custom `validate` function in `ConfigModule.forRoot()` explicitly checks for required variables like `DATABASE_URL` and `JWT_SECRET`, throwing descriptive errors if missing

**Configuration Sources and Usage**

- **Environment Variables**: Primary source via `.env` files, loaded by `@nestjs/config`
- **Direct process.env access**: Some legacy code still reads directly from `process.env` (e.g., `CORS_ORIGIN`, `UPLOAD_DIR`, `MAX_FILE_SIZE`), creating inconsistency
- **ConfigService injection**: Preferred method used throughout modern code (PrismaService, JwtStrategy, UploadController) via dependency injection

**Key Configuration Categories**

- **Database**: `DATABASE_URL` (required, validated)
- **Server**: `PORT` (defaults to 3000), `NODE_ENV` (enum validation)
- **Authentication**: `JWT_SECRET` (required), `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- **File Upload**: `UPLOAD_DIR`, `MAX_FILE_SIZE`, `FILE_TOKEN_TTL`
- **CORS**: `CORS_ORIGIN` (directly accessed from `process.env`)

**Integration Points**

- `main.ts`: Uses `ConfigService` for port and environment logging
- `database/prisma.service.ts`: Reads `DATABASE_URL` for Prisma client initialization
- `modules/auth/strategies/jwt.strategy.ts`: Uses `configService.getOrThrow('JWT_SECRET')` for JWT validation
- `modules/upload/upload.controller.ts`: Mixes `ConfigService` with direct `process.env` access

**Conventions and Constraints**

- All new configuration should go through the `EnvironmentVariables` class with appropriate validators
- Use `ConfigService` injection rather than direct `process.env` access for consistency
- Required variables must throw clear error messages during startup (fail-fast principle)
- Optional variables should provide sensible defaults in the validation class
- The system enforces that critical security variables (`DATABASE_URL`, `JWT_SECRET`) are always present before the application starts