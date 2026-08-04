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
---

The application implements a comprehensive system audit logging solution built around a dedicated `system-log` module. Unlike console-based logging frameworks, this is an in-application audit trail that persists every HTTP request and user action to the PostgreSQL database via Prisma.

**Core Architecture**

The logging system is centered on three key components:
- `LoggingInterceptor` (`API/src/common/interceptors/logging.interceptor.ts`) — A NestJS interceptor that automatically captures all HTTP requests, measures execution time, sanitizes sensitive data, and asynchronously writes structured logs via `SystemLogService`
- `SystemLogService` (`API/src/modules/system-log/system-log.service.ts`) — Handles log persistence through Prisma with filtering, pagination, statistics aggregation, and cleanup functionality
- `SystemLogController` (`API/src/modules/system-log/system-log.controller.ts`) — Exposes admin-only REST endpoints for querying and managing logs

**Structured Log Schema**

Logs are stored in a `SystemLog` model defined in `prisma/schema.prisma` with rich structured fields including:
- Action classification via `LogAction` enum (LOGIN, USER_CREATE, PROJECT_UPDATE, API_ERROR, etc.)
- Severity levels: INFO, WARNING, ERROR, CRITICAL
- User context (userId, userName, userEmail)
- Entity information (entity type, ID, name)
- Request details (URL, method, statusCode, duration, ipAddress, userAgent)
- Flexible JSON fields for details and metadata

**Security & Privacy Conventions**

The system enforces several security patterns:
- Sensitive fields are automatically redacted before logging (passwords, tokens, authentication headers)
- The `/api/v1/system-logs` endpoint itself is excluded from logging to prevent recursive logging
- All log management endpoints require ADMIN role via `@Roles(Role.ADMIN)` decorator
- Logs are immutable once created (no update operations)
- Automatic cleanup removes logs older than configurable days (default 90)

**Frontend Integration**

The React frontend provides an administrative interface at `src/pages/logs/LogsPage.tsx` with:
- Real-time polling (30-second intervals) for new logs
- Advanced filtering by search text, action type, severity, user, entity, and date range
- Grouping of consecutive logs by request/user combination
- Statistics dashboard showing counts by action, severity, and top users
- Pagination support with configurable page sizes

**Error Handling Strategy**

Log creation failures are non-blocking — errors during log persistence are caught and logged internally without affecting the main request flow. This ensures logging reliability doesn't impact application performance or availability.

**Data Retention**

Built-in cleanup functionality allows administrators to remove old logs based on retention policies, with the default configuration removing logs older than 90 days.