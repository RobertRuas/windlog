---
kind: logging_system
name: System Audit Logging with Prisma-backed Log Store
category: logging_system
scope:
    - '**'
source_files:
    - API/src/common/interceptors/logging.interceptor.ts
    - API/src/modules/system-log/system-log.service.ts
    - API/src/modules/system-log/system-log.controller.ts
    - API/src/modules/system-log/dto/system-log.dto.ts
    - API/prisma/schema.prisma
    - src/services/system-log.service.ts
    - src/pages/logs/LogsPage.tsx
    - src/utils/consoleCapture.ts
---

The application implements a comprehensive system audit logging pipeline that captures HTTP requests, maps them to typed actions and severity levels, persists structured logs in PostgreSQL via Prisma, and exposes an admin-only UI for inspection and management.

**Framework and approach**
- Backend: NestJS `NestInterceptor` (`LoggingInterceptor`) intercepts every HTTP request, measures duration, sanitizes sensitive fields, determines action/severity, and asynchronously writes logs through `SystemLogService`. The interceptor uses RxJS `tap` so log persistence never blocks the response.
- Storage: A dedicated `SystemLog` Prisma model stores each log entry with typed enums for `LogAction` and `LogSeverity`, JSON fields for `details`/`metadata`, and indexes on `userId`, `action`, `severity`, `entity+entityId`, `createdAt`, and composite `(createdAt, action)` / `(createdAt, userId)`.
- Frontend: A React `LogsPage` consumes `/api/v1/system-logs` endpoints via a typed service (`src/services/system-log.service.ts`) and provides filtering, pagination, grouping by request+user, and a capture toggle. An optional browser-side `consoleCapture.ts` utility temporarily overrides `console.*` to buffer client-side logs for feedback reports (in-memory only, max 50 entries).

**Architecture and conventions**
- Action taxonomy: `LogAction` enum covers authentication, user management, profile, phones, certifications, languages, documents, projects, turbines, technicians, project files, notifications, timesheets, feedback, and system events — kept in sync between DTO and Prisma schema.
- Severity mapping: `determineSeverity(statusCode)` maps ≥500 → `CRITICAL`, ≥400 → `WARNING`, else `INFO`; `determineAction` routes URL patterns to specific `LogAction` values.
- Sensitive data handling: `SENSITIVE_FIELDS` (`password`, `currentPassword`, `newPassword`, `confirmPassword`, `accessToken`, `refreshToken`, `token`) are redacted before logging; the frontend console capture also sanitizes objects and truncates large payloads.
- Excluded endpoints: `/api/v1/system-logs` is explicitly excluded from auto-logging to avoid recursive log queries.
- Capture control: `SystemLogService` holds an in-memory `captureEnabled` flag; when disabled, only `ERROR`/`CRITICAL` logs persist. Admin endpoints `GET/PATCH /api/v1/system-logs/capture` expose this toggle.
- Access control: All system-log controller endpoints require JWT + `ADMIN` role via `@UseGuards(AuthGuard('jwt'), RolesGuard)` and `@Roles(Role.ADMIN)`.
- Cleanup: `cleanup(days=90)` deletes logs older than the cutoff date; exposed as `DELETE /api/v1/system-logs/cleanup?days=N`.
- Structured fields: Every log carries `action`, `severity`, `message`, `userId/userName/userEmail`, `entity/entityId/entityName`, `details`/`metadata`, `ipAddress`, `userAgent`, `url`, `method`, `statusCode`, `duration`, `createdAt`.

**Key files and packages**
- `API/src/common/interceptors/logging.interceptor.ts` — HTTP request interception, sanitization, action/severity inference, async log creation.
- `API/src/modules/system-log/system-log.service.ts` — DB persistence, filtering, stats aggregation, capture toggle, cleanup.
- `API/src/modules/system-log/system-log.controller.ts` — Admin-only REST endpoints for listing, querying, stats, capture control, cleanup.
- `API/src/modules/system-log/dto/system-log.dto.ts` — `CreateLogDto`, `LogFilterDto`, `LogResponseDto`, `LogPaginatedResponseDto`, plus `LogAction`/`LogSeverity` enums.
- `API/prisma/schema.prisma` — `SystemLog` model, `LogAction`/`LogSeverity` enums, indexing strategy.
- `src/services/system-log.service.ts` — Frontend API client for system-log endpoints.
- `src/pages/logs/LogsPage.tsx` — Admin UI with filters, pagination, grouping, and capture toggle.
- `src/utils/consoleCapture.ts` — Optional browser console capture utility for feedback debugging.

**Conventions and constraints**
- Logs are immutable once created (no update/delete of individual entries); bulk deletion is only via the `cleanup` endpoint.
- All log writes are fire-and-forget from the interceptor; failures are caught and logged without affecting the request lifecycle.
- Search supports case-insensitive `contains` across `message`, `userName`, `userEmail`, `entityName`, `url`.
- Pagination defaults to `page=1, limit=50` with `totalPages`, `hasNextPage`, `hasPreviousPage` in responses.
- Stats aggregate by `action`, `severity`, and top 10 users.
- Frontend console capture is bounded at 50 entries and does not persist data.