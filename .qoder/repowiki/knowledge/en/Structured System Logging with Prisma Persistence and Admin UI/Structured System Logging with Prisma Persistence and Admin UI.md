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
    - src/services/system-log.service.ts
    - src/utils/consoleCapture.ts
---

The Windlog application implements a comprehensive structured logging system that automatically captures HTTP requests, sanitizes sensitive data, persists logs to PostgreSQL via Prisma, and exposes them through an admin-only API consumed by a React frontend dashboard.

**Framework and Architecture**
The logging system is built on NestJS interceptors rather than a dedicated logging library. A global `LoggingInterceptor` (`API/src/common/interceptors/logging.interceptor.ts`) wraps all HTTP requests, capturing method, URL, IP address, user-agent, execution duration, and response status codes. Logs are persisted through a dedicated `SystemLogService` (`API/src/modules/system-log/system-log.service.ts`) which writes to a `systemLog` Prisma model. The system uses a capture toggle persisted in the `SystemSetting` table (key `log_capture_enabled`) allowing admins to pause non-error logging without restarting the server.

**Structured Log Schema**
Logs follow a strict schema defined in `system-log.dto.ts` with two core enums: `LogAction` (LOGIN, LOGOUT, USER_CREATE, PROJECT_UPDATE, etc.) covering authentication, user management, profile operations, phone/certification/language CRUD, project/turbine/technician operations, notifications, and system events like API_ERROR and DATA_EXPORT. `LogSeverity` provides four levels: INFO, WARNING, ERROR, CRITICAL. Each log record includes userId, userName, userEmail, entity context (type/id/name), details/metadata JSON fields, ipAddress, userAgent, url, method, statusCode, and duration in milliseconds.

**Security and Privacy**
The interceptor maintains a `SENSITIVE_FIELDS` list (password, currentPassword, newPassword, confirmPassword, accessToken, refreshToken, token) that gets redacted before persistence. An `EXCLUDED_ENDPOINTS` array prevents logging of the `/api/v1/system-logs` endpoint itself. Client IP extraction handles proxy headers via `x-forwarded-for`. All log endpoints require JWT authentication and ADMIN role enforcement through `RolesGuard`.

**Capture Control and Performance**
When capture is disabled via the `PATCH /api/v1/system-logs/capture` endpoint, only ERROR and CRITICAL severity logs continue being saved. The service caches the capture flag in memory after loading from the database at module initialization, avoiding per-request database queries. Log creation is fire-and-forget (async, non-blocking) to avoid impacting request latency.

**Frontend Integration**
The React frontend (`src/services/system-log.service.ts`) provides typed methods for querying logs with filters (search, action, severity, userId, entity, date range, pagination). A separate `consoleCapture.ts` utility temporarily overrides browser console methods to collect client-side debugging information for feedback reports, limited to 50 entries in memory with automatic sanitization.

**Admin Interface**
The `LogsPage` and associated components (`LogFilters`, `LogRow`, `LogStats`, `LogTable`) provide a full admin dashboard for browsing, filtering, and managing system logs, including statistics aggregation and cleanup operations for logs older than configurable days.