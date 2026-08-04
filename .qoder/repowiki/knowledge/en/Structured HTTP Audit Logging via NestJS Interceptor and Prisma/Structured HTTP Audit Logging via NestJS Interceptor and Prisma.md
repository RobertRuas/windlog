---
kind: logging_system
name: Structured HTTP Audit Logging via NestJS Interceptor and Prisma
category: logging_system
scope:
    - '**'
source_files:
    - API/src/common/interceptors/logging.interceptor.ts
    - API/src/modules/system-log/system-log.service.ts
    - API/src/modules/system-log/dto/system-log.dto.ts
    - API/src/modules/system-log/system-log.controller.ts
    - API/src/main.ts
    - src/services/system-log.service.ts
    - src/utils/consoleCapture.ts
---

The application implements a structured, database-backed audit logging system centered around a NestJS `LoggingInterceptor` that automatically captures every HTTP request/response and persists it to a Prisma-managed `systemLog` table. The system is designed as an audit trail rather than a traditional console logger: logs are immutable records with typed actions, severity levels, and rich contextual fields (user identity, IP, user-agent, URL, method, status code, duration, sanitized body details).

**Backend architecture**
- `LoggingInterceptor` (`API/src/common/interceptors/logging.interceptor.ts`) is registered globally in `main.ts` and wraps all requests. It extracts request metadata, sanitizes sensitive fields (passwords, tokens) before logging, determines a `LogAction` enum value based on URL/method patterns, derives `LogSeverity` from HTTP status codes, and calls `SystemLogService.create()` asynchronously so logging never blocks the response.
- `SystemLogService` (`API/src/modules/system-log/system-log.service.ts`) writes logs through Prisma, supports paginated filtered queries, per-ID retrieval, aggregate statistics (by action, severity, top users), and a cleanup routine that deletes logs older than a configurable number of days (default 90).
- DTOs in `system-log.dto.ts` define the canonical schema: `LogAction` (LOGIN, USER_CREATE, PROJECT_UPDATE, API_ERROR, etc.), `LogSeverity` (INFO, WARNING, ERROR, CRITICAL), `CreateLogDto`, `LogFilterDto`, and response types. These enums must stay in sync with the Prisma schema's `LogAction` type.
- `SystemLogController` exposes admin-only endpoints (`/api/v1/system-logs`) guarded by JWT + `RolesGuard(Role.ADMIN)`: list with filters, get by ID, stats, and cleanup.
- The interceptor excludes `/api/v1/system-logs` from being logged to avoid infinite recursion.

**Frontend integration**
- A dedicated `system-log.service.ts` under `src/services/` mirrors the backend API for fetching paginated logs, individual logs, stats, and triggering cleanup.
- `src/utils/consoleCapture.ts` provides optional browser-side console capture: it temporarily overrides `console.error/warn/log/info`, stores up to 50 entries in memory, and also hooks `window.onerror` and `unhandledrejection`. Captured logs are formatted for inclusion in user feedback reports but are not persisted.
- The Logs page (`src/pages/logs/`) renders filtering, pagination, and statistics against the backend API.

**Data model and structure**
Each log record contains: `action`, `severity`, `message`, optional `userId/userName/userEmail`, optional `entity/entityId/entityName`, JSON `details` and `metadata`, plus `ipAddress`, `userAgent`, `url`, `method`, `statusCode`, `duration`, and `createdAt`. Logs are never updated or deleted except via the admin cleanup endpoint; they are append-only.

**Conventions and constraints**
- All HTTP traffic is automatically audited; no manual logging calls are needed at controller/service boundaries.
- Sensitive request body fields (`password`, `currentPassword`, `newPassword`, `confirmPassword`, `accessToken`, `refreshToken`, `token`) are redacted before persistence.
- Severity mapping is deterministic: ≥500 → CRITICAL, ≥400 → WARNING, else INFO.
- Log creation failures are swallowed and only logged via NestJS `Logger`; they do not propagate to clients.
- Admin-only access is enforced at the controller level via `@UseGuards(AuthGuard('jwt'), RolesGuard)` and `@Roles(Role.ADMIN)`.
- Frontend console capture is opt-in via `startConsoleCapture()` / `stopConsoleCapture()` and is limited to 50 entries in memory.