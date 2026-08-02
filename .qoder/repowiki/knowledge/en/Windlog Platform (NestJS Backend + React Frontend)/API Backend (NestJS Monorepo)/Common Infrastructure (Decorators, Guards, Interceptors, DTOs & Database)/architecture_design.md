The module is organized as a flat barrel (`common/index.ts`) that re-exports all cross-cutting concerns for the rest of the application:
- `decorators/` — `@CurrentUser()` extracts the authenticated user from the request (populated by `JwtAuthGuard`), and `@Roles()` + `ROLES_KEY` metadata drives RBAC.
- `guards/roles.guard.ts` — reads role metadata via `Reflector` and compares against `request.user.role`; must run after `JwtAuthGuard`.
- `filters/http-exception.filter.ts` — global `@Catch()` filter that normalizes all errors into `{error, message, statusCode, timestamp, path}`.
- `interceptors/` — `LoggingInterceptor` maps URL+method to `LogAction` enums and writes async logs via `SystemLogService`; `TransformInterceptor` wraps every successful controller response into `StandardResponse<T>`.
- `dto/` — `PaginationDto` (class-validator + class-transformer) plus `ApiResponse`/`ApiError`/`PaginatedResponse` interfaces and Swagger-only classes in `swagger-response.dto.ts`.
- `utils/index.ts` — pure helpers (`formatDate`, `buildPaginationMeta`).
- `config/env.validation.ts` — `EnvironmentVariables` class using `class-validator` decorators for fail-fast `.env` validation.
- `database/prisma.service.ts` — `PrismaService` extends `PrismaClient`, injects `ConfigService` for `DATABASE_URL`, creates a `PrismaPg` adapter for Prisma v7, and connects/disconnects via `OnModuleInit`/`OnModuleDestroy`.

Dependency direction: this module depends only on `@nestjs/common`, `@nestjs/config`, `class-validator`, `class-transformer`, `@prisma/adapter-pg`, and the generated Prisma client. It does NOT depend on any business modules except `LoggingInterceptor`, which reaches into `modules/system-log` to persist audit entries.