---
kind: logging_system
name: Structured Audit Logging System with Prisma Persistence
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
---

The Windlog application implements a comprehensive structured audit logging system that captures HTTP requests, user actions, and system events into a persistent database. The system operates on both backend (NestJS) and frontend (React) layers with distinct responsibilities.

**Backend Architecture:**
The core logging infrastructure is built around a NestJS `LoggingInterceptor` (`API/src/common/interceptors/logging.interceptor.ts`) that automatically intercepts all HTTP requests and creates structured log entries. The interceptor extracts request metadata including HTTP method, URL, client IP (with proxy support via `x-forwarded-for`), User-Agent, authentication context, and execution duration. Sensitive fields like passwords, tokens, and authentication data are automatically sanitized before logging using a predefined `SENSITIVE_FIELDS` list.

Log persistence is handled by `SystemLogService` (`API/src/modules/system-log/system-log.service.ts`) which writes to a PostgreSQL database through Prisma ORM. The service implements an in-memory cache for the `log_capture_enabled` setting stored in the `SystemSetting` table, allowing runtime control over log capture without server restarts. When capture is disabled, only ERROR and CRITICAL severity logs continue to be recorded.

**Data Model:**
The `SystemLog` model in `prisma/schema.prisma` defines a comprehensive schema with fields for action classification (`LogAction` enum with 40+ predefined actions covering authentication, user management, projects, notifications, etc.), severity levels (`INFO`, `WARNING`, `ERROR`, `CRITICAL`), user context, entity relationships, request details, and performance metrics. The schema includes multiple indexes for efficient querying by userId, action, severity, entity combinations, and date ranges.

**Frontend Integration:**
The React frontend provides a dedicated Logs page (`src/pages/logs/`) with filtering, pagination, and statistics visualization. The `consoleCapture.ts` utility (`src/utils/consoleCapture.ts`) captures browser console output during feedback sessions, storing up to 50 logs in memory with automatic sanitization and error handling for uncaught exceptions and promise rejections.

**Security and Access Control:**
All system log endpoints require JWT authentication and ADMIN role authorization through NestJS guards. The system excludes sensitive endpoints from automatic logging and redacts sensitive data patterns. Log cleanup operations are available for maintaining database size with configurable retention periods.

**Operational Features:**
The system provides real-time capture toggling via REST endpoints, comprehensive search and filtering capabilities across multiple dimensions (text search, action types, severity levels, date ranges, user/entity filters), statistical aggregations, and automated cleanup of old logs. The interceptor ensures non-blocking log creation to avoid impacting request response times.