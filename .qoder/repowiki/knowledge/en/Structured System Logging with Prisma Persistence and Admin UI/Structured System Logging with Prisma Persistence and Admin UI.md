---
kind: logging_system
name: Structured System Logging with Prisma Persistence and Admin UI
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
    - src/utils/consoleCapture.ts
    - src/pages/logs/LogsPage.tsx
---

The Windlog application implements a comprehensive, structured system logging pipeline that automatically captures HTTP requests, persists them to PostgreSQL via Prisma, and exposes them through an admin-only frontend interface. The system spans both the NestJS backend and React frontend.

**Backend Architecture**

The core logging mechanism is implemented as a NestJS `LoggingInterceptor` (`API/src/common/interceptors/logging.interceptor.ts`) that intercepts all HTTP requests before they reach controllers. It captures method, URL, client IP (via `x-forwarded-for`), user-agent, request body, execution duration, and response status code. Sensitive fields (password, tokens, etc.) are redacted using a whitelist-based sanitizer before persistence. Logs are created asynchronously via `SystemLogService` so they never block the response flow.

The `SystemLogService` (`API/src/modules/system-log/system-log.service.ts`) provides CRUD operations against the `SystemLog` Prisma model, including paginated queries with rich filters (search text, action type, severity level, user ID, entity type, date range). It also exposes statistics aggregation grouped by action, severity, and top users, plus a cleanup endpoint for removing logs older than a configurable number of days (default 90).

**Data Model and Enums**

The Prisma schema defines two key enums: `LogAction` (covering authentication events, user management, profile operations, project/turbine CRUD, notifications, system errors, and data export/import) and `LogSeverity` (INFO, WARNING, ERROR, CRITICAL). The `SystemLog` model stores denormalized user information (userId, userName, userEmail) for query performance, along with JSON fields for `details` and `metadata`. Multiple indexes are defined on userId, action, severity, entity combinations, and createdAt for efficient filtering.

**Security and Access Control**

All system log endpoints are protected by JWT authentication and require the ADMIN role via the `RolesGuard`. The interceptor explicitly excludes `/api/v1/system-logs` from being logged to prevent recursive logging of log queries. Error handling in the service swallows exceptions during log creation to ensure logging failures don't impact application functionality.

**Frontend Integration**

The React frontend includes a dedicated `LogsPage` (`src/pages/logs/LogsPage.tsx`) with filtering, pagination, and grouping of consecutive logs by request+user. The `system-log.service.ts` provides typed TypeScript interfaces matching the backend DTOs. Additionally, `consoleCapture.ts` captures browser console output (error, warn, log, info) and unhandled promise rejections into memory for inclusion in user feedback reports, with a 50-log limit and sanitization.

**Conventions**

- Log actions are determined by URL pattern matching in the interceptor (e.g., `/auth/login` → LOGIN or LOGIN_FAILED)
- Severity is derived from HTTP status codes (≥500 → CRITICAL, ≥400 → WARNING, else INFO)
- All timestamps use UTC, IDs are UUIDs, and logs are immutable (no updates, only creates and cleanup deletes)
- Frontend types mirror backend DTOs exactly for type safety across the API boundary