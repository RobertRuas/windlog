---
kind: logging_system
name: System-Wide HTTP Request Logging with Prisma Persistence
category: logging_system
scope:
    - '**'
source_files:
    - API/src/common/interceptors/logging.interceptor.ts
    - API/src/modules/system-log/system-log.service.ts
    - API/src/modules/system-log/system-log.controller.ts
    - API/src/modules/system-log/dto/system-log.dto.ts
    - API/src/modules/system-log/system-log.module.ts
    - API/src/main.ts
---

The application implements a centralized, interceptor-driven logging system built on NestJS's `@nestjs/common` Logger and persisted to the database via Prisma. It automatically captures every HTTP request/response cycle, sanitizes sensitive data, classifies actions and severity, and exposes admin-only endpoints for querying and cleaning up logs.

**Framework and core components**
- NestJS `Logger` is used for internal service-level logging (e.g., bootstrap, create failures).
- A global `LoggingInterceptor` (`API/src/common/interceptors/logging.interceptor.ts`) wraps all requests, measures duration, extracts client IP and User-Agent, and calls `SystemLogService.create()` asynchronously so logging never blocks responses.
- The persistence layer is a dedicated `system-log` module (`API/src/modules/system-log/`) with a controller, service, DTOs, and a Prisma-backed `SystemLog` entity.
- The interceptor is registered globally in `API/src/main.ts` after the transform interceptor, ensuring it runs for every route.

**Structured log fields and schema**
The `CreateLogDto` defines the canonical set of fields stored per log entry:
- Action classification (`LogAction` enum: LOGIN, LOGOUT, USER_CREATE, PROJECT_UPDATE, API_ERROR, etc.)
- Severity level (`LogSeverity`: INFO, WARNING, ERROR, CRITICAL)
- Human-readable `message`
- Actor context: `userId`, `userName`, `userEmail`
- Entity context: `entity`, `entityId`, `entityName`
- Free-form JSON blobs: `details`, `metadata`
- Network context: `ipAddress`, `userAgent`, `url`, `method`, `statusCode`, `duration` (ms)

Severity is derived from HTTP status codes (≥500 → CRITICAL, ≥400 → WARNING, else INFO). Actions are inferred from URL patterns and HTTP methods inside the interceptor's `determineAction` method.

**Data sanitization and privacy rules**
- A hardcoded `SENSITIVE_FIELDS` list (`password`, `currentPassword`, `newPassword`, `confirmPassword`, `accessToken`, `refreshToken`, `token`) is redacted before any body is persisted.
- The `/api/v1/system-logs` endpoint itself is excluded from logging to avoid recursive log entries.
- Logs are treated as immutable: the service only creates; updates are not supported.

**Querying, filtering, and administration**
- `SystemLogService.findAll` supports text search across message/user/entity/url, plus filters by `action`, `severity`, `userId`, `entity`, and a date range (`startDate`/`endDate`). Results are paginated with `page`/`limit`.
- `getStats` returns counts grouped by action, severity, and top users.
- `cleanup(days)` deletes logs older than a cutoff (default 90 days) for maintenance.
- All system-log endpoints are protected by JWT + `RolesGuard` restricted to `ADMIN`.

**Frontend integration**
A `LogsPage` and supporting components (`LogFilters`, `LogRow`, `LogStats`, `LogTable`) under `src/pages/logs/` consume the system-log REST API to display filtered, paginated logs and statistics to administrators.

**Conventions and constraints observed**
- Every HTTP request is logged automatically through the global interceptor; modules do not need to call the logger explicitly for request tracing.
- Sensitive request bodies are always sanitized before persistence.
- Log creation is fire-and-forget: failures are caught and logged internally without propagating to the caller.
- New action types must be added both to the `LogAction` enum and to the interceptor's `determineAction` mapping to be recognized.