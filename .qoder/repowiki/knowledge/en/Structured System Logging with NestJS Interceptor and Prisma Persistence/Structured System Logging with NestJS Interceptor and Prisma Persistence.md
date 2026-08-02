---
kind: logging_system
name: Structured System Logging with NestJS Interceptor and Prisma Persistence
category: logging_system
scope:
    - '**'
source_files:
    - API/src/common/interceptors/logging.interceptor.ts
    - API/src/modules/system-log/system-log.service.ts
    - API/src/modules/system-log/dto/system-log.dto.ts
    - API/src/modules/system-log/system-log.controller.ts
    - API/src/main.ts
    - API/prisma/schema.prisma
    - src/services/system-log.service.ts
---

The Windlog platform implements a comprehensive structured logging system built around a NestJS global interceptor that automatically captures HTTP requests and persists them to a PostgreSQL database via Prisma. The system is centered on the `SystemLog` model defined in `API/prisma/schema.prisma`, which stores action types, severity levels, user context, request details, and performance metrics.

**Core Architecture:**
The logging pipeline flows through three main layers:
1. **Interception Layer**: `LoggingInterceptor` (`API/src/common/interceptors/logging.interceptor.ts`) intercepts all HTTP requests globally via `app.useGlobalInterceptors()` in `main.ts`, capturing method, URL, IP, user-agent, timing, and status codes
2. **Service Layer**: `SystemLogService` (`API/src/modules/system-log/system-log.service.ts`) handles async persistence to Prisma with error handling that doesn't block request flow
3. **Storage Layer**: Prisma `SystemLog` model with indexed fields for efficient querying by userId, action, severity, entity relationships, and date ranges

**Structured Log Fields:**
Each log entry captures standardized fields including: `action` (enum of 40+ predefined actions like LOGIN, USER_CREATE, PROJECT_UPDATE), `severity` (INFO/WARNING/ERROR/CRITICAL), `message`, user context (userId, userName, userEmail), entity information (entity, entityId, entityName), request details (ipAddress, userAgent, url, method, statusCode, duration), and flexible JSON fields for `details` and `metadata`.

**Security and Privacy:**
The system includes automatic sanitization of sensitive fields (password, tokens, etc.) before logging, excludes the `/api/v1/system-logs` endpoint from being logged to prevent recursive logging, and restricts log access to ADMIN role only via `@Roles(Role.ADMIN)` decorator on the controller.

**Frontend Integration:**
The React frontend (`src/services/system-log.service.ts`) provides typed methods for administrators to query logs with filters, view statistics, and perform cleanup operations through dedicated endpoints under `/api/v1/system-logs`.

**Operational Features:**
The system supports paginated queries with multiple filter options (search text, action type, severity level, user ID, entity type, date ranges), statistical aggregation by action/severity/top users, and automated cleanup of logs older than configurable thresholds (default 90 days). Logs are created asynchronously using `.catch()` patterns to ensure logging failures don't impact application performance.