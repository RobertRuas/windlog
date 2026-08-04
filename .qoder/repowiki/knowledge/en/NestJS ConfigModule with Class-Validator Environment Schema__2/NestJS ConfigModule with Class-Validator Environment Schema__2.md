---
kind: configuration_system
name: NestJS ConfigModule with Class-Validator Environment Schema
category: configuration_system
scope:
    - '**'
source_files:
    - API/src/app.module.ts
    - API/src/main.ts
    - API/src/config/env.validation.ts
    - API/src/modules/auth/auth.module.ts
    - API/src/database/prisma.service.ts
---

The Windlog backend uses NestJS's `@nestjs/config` package as its central configuration system, layered with runtime validation via `class-validator` decorators. Configuration is loaded from `.env` files and exposed through a typed `ConfigService` singleton that is injected across modules.

**Loading and validation pipeline**
- `AppModule` registers `ConfigModule.forRoot()` with `isGlobal: true`, so every module can access configuration without re-importing.
- A custom `validate` function in `app.module.ts` enforces that `DATABASE_URL` and `JWT_SECRET` are present at startup; missing values cause an immediate error (fail-fast).
- `src/config/env.validation.ts` defines an `EnvironmentVariables` class whose properties map one-to-one to environment variables (`DATABASE_URL`, `PORT`, `NODE_ENV`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `UPLOAD_DIR`, `MAX_FILE_SIZE`, `FILE_TOKEN_TTL`). Each property is decorated with validators (`IsString`, `IsNotEmpty`, `IsNumber`, `IsOptional`, `IsEnum`, `Min`) so the application refuses to start if any variable has an invalid type or value.
- The `NODE_ENV` enum restricts environments to `development`, `production`, `test`, and `staging`.

**How configuration is consumed**
- `main.ts` reads `PORT` and `NODE_ENV` via `configService.get<number>('PORT', 3000)` and `configService.get<string>('NODE_ENV', 'development')`.
- `AuthModule` configures JWT signing asynchronously using `JwtModule.registerAsync`, injecting `ConfigService` and calling `configService.getOrThrow<string>('JWT_SECRET')` plus `configService.get<string>('JWT_EXPIRES_IN', '1d')`.
- `PrismaService` reads `DATABASE_URL` from `ConfigService` to construct the PostgreSQL adapter connection string.
- Several controllers and services also fall back to direct `process.env['UPLOAD_DIR']` / `process.env['MAX_FILE_SIZE']` calls, which bypasses the typed config layer.

**Cross-cutting defaults and behavior**
- Global route prefix is set to `/api/v1` in `main.ts`.
- CORS is enabled with `origin: true` (accepts all origins), credentials allowed, and standard HTTP methods.
- Helmet CSP is relaxed to allow inline scripts/styles for Swagger UI.
- Body parser limits are raised to 10 MB to support base64 image uploads.
- Prisma scripts (`seed.ts`, `fix-duplicates.ts`, `sync-notifications.ts`) and `prisma.config.ts` load `.env` via `import 'dotenv/config'` and read `DATABASE_URL` directly from `process.env`.

**Conventions observed**
- All required secrets and connection strings go through `ConfigService`; optional settings have sensible defaults in both the validator class and fallback `process.env` reads.
- New environment variables should be added to `EnvironmentVariables` with appropriate `class-validator` decorators to keep the fail-fast guarantee.
- Direct `process.env` usage exists in a few controller/service files for upload-related settings, indicating an incomplete migration away from raw env access.