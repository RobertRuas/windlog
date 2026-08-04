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
    - API/src/modules/upload/upload.service.ts
---

The Windlog backend uses a NestJS-based configuration system centered around `@nestjs/config` with strict environment variable validation and centralized loading.

**Core Framework and Loading**
The application uses `@nestjs/config` (ConfigModule) as the primary configuration mechanism. The root `AppModule` registers ConfigModule with `forRoot({ isGlobal: true, validate: ... })`, making configuration available globally across all modules without re-importing. The `.env` file is automatically loaded by dotenv (included as a devDependency), which ConfigModule consumes at startup.

**Environment Variable Validation**
The system enforces strict validation through a dedicated `EnvironmentVariables` class in `API/src/config/env.validation.ts`. This class uses `class-validator` decorators (`IsString`, `IsNotEmpty`, `IsNumber`, `IsOptional`, `IsEnum`, `Min`) to define schema-like validation rules for each environment variable. Variables are categorized into sections: database (`DATABASE_URL`), server (`PORT`, `NODE_ENV`), JWT authentication (`JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`), and file upload settings (`UPLOAD_DIR`, `MAX_FILE_SIZE`, `FILE_TOKEN_TTL`). The validation runs at startup with fail-fast behavior — if any required variable is missing or invalid, the application throws an error before starting.

**Configuration Access Patterns**
Modules access configuration through dependency injection of `ConfigService`. The pattern is consistent: inject `ConfigService` via constructor parameters and call `configService.get<T>('VAR_NAME', defaultValue)` to retrieve typed values with optional defaults. Examples include:
- `main.ts`: retrieves `PORT` and `NODE_ENV` for server bootstrap
- `database/prisma.service.ts`: reads `DATABASE_URL` for Prisma client initialization
- `modules/auth/strategies/jwt.strategy.ts`: loads JWT secret and expiration settings
- `modules/upload/upload.controller.ts` and `upload.service.ts`: configure upload directory and file size limits

**Dual Access Pattern (Issue)**
There is an inconsistency in the codebase where some modules bypass `ConfigService` and directly access `process.env['VARIABLE']` (found in `auth.controller.ts`, `projects.controller.ts`, and `upload.controller.ts`). While these direct accesses use fallback defaults matching the `.env` values, this pattern undermines the centralized configuration approach and type safety provided by `ConfigService`.

**Additional Runtime Configuration**
Beyond environment variables, runtime configuration is handled through:
- Global middleware setup in `main.ts` (Helmet security headers, CORS with `origin: true`, compression)
- Global pipes and interceptors for request/response transformation
- Swagger/OpenAPI documentation configuration
- Express-level body parser limits (10mb for base64 image support)

**No .env File in Repository**
No `.env` file exists in the repository (likely gitignored), which is the correct practice for secrets. The validation layer ensures all required variables are present at startup, preventing silent failures from missing configuration.