---
kind: logging_system
name: Structured HTTP Request Logging with Persistent Audit Trail
category: logging_system
scope:
    - '**'
source_files:
    - API/src/common/interceptors/logging.interceptor.ts
    - API/src/modules/system-log/system-log.service.ts
    - API/src/modules/system-log/system-log.controller.ts
    - API/src/modules/system-log/dto/system-log.dto.ts
    - API/src/main.ts
    - src/services/system-log.service.ts
---

The Windlog application implements a comprehensive, structured logging system centered around automatic HTTP request interception and persistent audit logging to PostgreSQL via Prisma. The system captures every incoming API request, sanitizes sensitive data, classifies actions and severity levels, and stores logs for administrative review through a dedicated admin UI.

**Core Framework and Approach**
The logging system is built on NestJS's interceptor pattern rather than an external logging library (winston, pino, bunyan). All HTTP requests are intercepted globally via `LoggingInterceptor` registered in `main.ts`, which automatically captures request/response lifecycle events, measures execution duration, and persists structured log entries to the database through `SystemLogService`. The system uses NestJS's built-in `Logger` class only for internal service-level diagnostics, not for application request logging.

**Architecture Components**
- **Interception Layer**: `LoggingInterceptor` (`API/src/common/interceptors/logging.interceptor.ts`) intercepts all HTTP requests, extracts metadata (method, URL, IP, user-agent, authenticated user), sanitizes request bodies by redacting sensitive fields (password, tokens), determines action types based on URL patterns and HTTP methods, and calculates severity from status codes (5xx = CRITICAL, 4xx = WARNING, 2xx = INFO).
- **Persistence Layer**: `SystemLogService` (`API/src/modules/system-log/system-log.service.ts`) handles async log creation to avoid blocking responses, provides filtering/pagination capabilities, and includes cleanup functionality for old logs.
- **API Exposure**: `SystemLogController` exposes REST endpoints (`/api/v1/system-logs`) protected by JWT authentication and ADMIN role guards for administrative access.
- **Frontend Integration**: React frontend (`src/services/system-log.service.ts`) provides typed interfaces and methods for querying logs, viewing statistics, and performing cleanup operations.

**Structured Log Schema**
Logs are stored with rich contextual fields including: action classification (LOGIN, USER_CREATE, PROJECT_UPDATE, etc.), severity levels (INFO, WARNING, ERROR, CRITICAL), user identification (userId, userName, userEmail), entity context (entity, entityId, entityName), request details (ipAddress, userAgent, url, method, statusCode, duration), and optional JSON payloads for details and metadata. The schema supports both immutable audit trails and flexible extensibility.

**Security and Privacy Conventions**
- Sensitive fields are automatically redacted before logging using a whitelist approach (`SENSITIVE_FIELDS` array)
- Log query endpoints are excluded from automatic logging to prevent recursive logging loops
- Admin-only access control via roles guard ensures only authorized users can view or manage logs
- Error handling prevents logging failures from disrupting normal request processing

**Operational Features**
- Asynchronous log creation ensures request performance is not impacted by logging overhead
- Comprehensive filtering support (search, action, severity, userId, entity, date range) with pagination
- Statistical aggregation by action type, severity level, and top active users
- Configurable log retention with cleanup endpoint supporting configurable day thresholds
- Database-backed storage enables historical analysis and compliance auditing

**Frontend Visualization**
The React application includes a dedicated Logs page with filtering components, tabular display, statistical summaries, and real-time updates through TanStack Query integration.