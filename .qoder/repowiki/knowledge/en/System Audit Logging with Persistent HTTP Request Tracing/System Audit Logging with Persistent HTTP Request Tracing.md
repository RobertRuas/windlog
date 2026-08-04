---
kind: logging_system
name: System Audit Logging with Persistent HTTP Request Tracing
category: logging_system
scope:
    - '**'
source_files:
    - API/src/common/interceptors/logging.interceptor.ts
    - API/src/modules/system-log/system-log.service.ts
    - API/src/modules/system-log/system-log.controller.ts
    - API/src/modules/system-log/dto/system-log.dto.ts
    - API/prisma/schema.prisma
    - src/utils/consoleCapture.ts
    - src/pages/logs/LogsPage.tsx
---

The Windlog application implements a comprehensive system audit logging approach centered around persistent, structured HTTP request tracing backed by Prisma/PostgreSQL. This is not a traditional console/file-based logger but rather an application-level audit trail that captures every API request and stores it as a first-class domain entity.

**Core Architecture:**
The logging system is built around a NestJS `LoggingInterceptor` (`API/src/common/interceptors/logging.interceptor.ts`) registered globally in `main.ts`, which automatically intercepts all HTTP requests and persists them via `SystemLogService`. The interceptor captures method, URL, IP address, user-agent, execution duration, status code, and authenticated user context, while sanitizing sensitive fields (passwords, tokens) before storage. Logs are created asynchronously to avoid blocking response processing.

**Structured Log Model:**
The system uses strongly-typed enums for both actions (`LogAction`: LOGIN, USER_CREATE, PROJECT_UPDATE, etc.) and severity levels (`LogSeverity`: INFO, WARNING, ERROR, CRITICAL). Each log entry includes contextual fields like userId/userName/userEmail, affected entity information, request details (URL, method, statusCode, duration), and optional JSON fields for additional details and metadata. The schema defines extensive indexing on userId, action, severity, entity combinations, and createdAt for efficient querying.

**Persistence and Management:**
Logs are stored in the `SystemLog` Prisma model with automatic timestamps and soft-delete support consistent with the multi-tenant architecture. The `SystemLogService` provides CRUD operations including paginated filtering by search text, action type, severity, user, entity, and date ranges. A cleanup endpoint allows administrators to remove logs older than a configurable number of days (default 90).

**Access Control:**
All system log endpoints are protected behind JWT authentication and require ADMIN role through the existing `RolesGuard`. The `/api/v1/system-logs` endpoints provide read access to logs, statistics aggregation, and maintenance operations.

**Frontend Integration:**
The React frontend includes a dedicated `LogsPage` component (`src/pages/logs/LogsPage.tsx`) with filtering, grouping by request+user, and real-time polling (30-second intervals) for log updates. It displays aggregated statistics and supports expanding individual log entries to view full details.

**Console Capture Utility:**
The frontend also includes a separate `consoleCapture.ts` utility that temporarily overrides browser console methods to capture client-side errors and warnings for feedback reports, storing up to 50 logs in memory with automatic sanitization.

**Conventions Observed:**
- All API requests are automatically logged without explicit developer intervention
- Sensitive data is redacted using a whitelist of field names before persistence
- Log creation failures are silently caught to prevent impacting main request flow
- Logs use UUID identifiers and UTC timestamps throughout
- The system maintains denormalized user information (name, email) for query performance
- Action types follow a consistent naming pattern (RESOURCE_ACTION format)
- Severity mapping is derived from HTTP status codes (5xx=CRITICAL, 4xx=WARNING, others=INFO)