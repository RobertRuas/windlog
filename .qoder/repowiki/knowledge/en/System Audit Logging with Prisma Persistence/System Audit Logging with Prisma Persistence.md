---
kind: logging_system
name: System Audit Logging with Prisma Persistence
category: logging_system
scope:
    - '**'
source_files:
    - API/src/common/interceptors/logging.interceptor.ts
    - API/src/modules/system-log/system-log.module.ts
    - API/src/modules/system-log/system-log.controller.ts
    - API/src/modules/system-log/system-log.service.ts
    - API/src/modules/system-log/dto/system-log.dto.ts
    - API/prisma/schema.prisma
    - src/services/system-log.service.ts
    - src/pages/logs/LogsPage.tsx
---

The application implements a centralized system audit logging subsystem built around a NestJS interceptor, a dedicated SystemLog module, and a Prisma-backed `SystemLog` table. It captures HTTP request/response lifecycle events, sanitizes sensitive data, persists structured log records, and exposes admin-only endpoints for querying and cleanup.

**Framework and persistence**
- Interception layer: `LoggingInterceptor` (NestJS `NestInterceptor`) wraps every request, measures duration, derives action/severity, and calls `SystemLogService.create()` asynchronously so logging never blocks the response.
- Persistence: `SystemLogService` writes to the `SystemLog` model via Prisma (`PrismaService`). The schema defines enums `LogAction`, `LogSeverity`, and a `SystemLog` model with fields for user context, entity context, request details, JSON `details`/`metadata`, and timestamps. Indices cover `userId`, `action`, `severity`, `entity+entityId`, `createdAt`, and composite `(createdAt, action)`, `(createdAt, userId)`.
- Frontend: A React page (`src/pages/logs/LogsPage.tsx`) and service (`src/services/system-log.service.ts`) call `/api/v1/system-logs` endpoints to display paginated logs, stats, and trigger cleanup.

**Architecture and conventions**
- Global module: `SystemLogModule` is marked `@Global()`, exporting `SystemLogService` so any module can inject it without explicit imports.
- Action taxonomy: `LogAction` enum enumerates authentication, user management, profile, phones, certifications, languages, documents, projects, turbines, technicians, project files, notifications, timesheets, system errors, access denied, data export/import, and a catch-all `OTHER`. The interceptor maps URL patterns + HTTP methods to these actions.
- Severity mapping: `determineSeverity` assigns `CRITICAL` for ≥500, `WARNING` for ≥400, otherwise `INFO`.
- Sensitive data redaction: `SENSITIVE_FIELDS` (`password`, `currentPassword`, `newPassword`, `confirmPassword`, `accessToken`, `refreshToken`, `token`) are replaced with `[REDACTED]` in captured request bodies before persistence.
- Excluded endpoints: `/api/v1/system-logs` is excluded from auto-logging to avoid recursive log entries.
- IP extraction: `getClientIp` reads `x-forwarded-for` first, then falls back to `request.ip` / `socket.remoteAddress`.
- Error handling: `SystemLogService.create` catches DB errors and logs them via Nest `Logger` but returns `null` rather than throwing, preserving request flow.
- Cleanup: `cleanup(days)` deletes logs older than a cutoff date (default 90 days).

**API surface**
- `GET /api/v1/system-logs` — paginated list with filters (`search`, `action`, `severity`, `userId`, `entity`, `startDate`, `endDate`, `page`, `limit`).
- `GET /api/v1/system-logs/stats` — counts by action, severity, and top users.
- `GET /api/v1/system-logs/:id` — single log by ID.
- `DELETE /api/v1/system-logs/cleanup?days=90` — purge old logs.
- All endpoints require JWT auth and `ADMIN` role via `RolesGuard` and `@Roles(Role.ADMIN)`.

**Frontend integration**
- `src/services/system-log.service.ts` defines TypeScript interfaces mirroring the backend DTOs and calls the REST endpoints through a shared `api` client.
- `src/pages/logs/LogsPage.tsx` groups consecutive logs by method+url+user, shows statistics, supports filtering/pagination, and refetches periodically.

**Constraints and rules observed**
- Logs are immutable once created (service comments state they are never updated or deleted except via the explicit cleanup endpoint).
- Logging is asynchronous and non-blocking; failures to persist do not affect the caller.
- Sensitive fields are always redacted before storage.
- Only ADMIN users may read or manage logs.