---
kind: logging_system
name: Structured System Audit Logging with Prisma Persistence
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
---

## What system/approach is used

The application implements a structured, database-backed audit logging system built on NestJS interceptors and Prisma ORM. All HTTP requests are automatically captured via a global `LoggingInterceptor` that records request/response metadata, user context, timing, and sanitized payloads into a dedicated `SystemLog` Prisma model. Logs are persisted asynchronously to avoid blocking request processing, and an admin-only REST API exposes filtering, pagination, statistics, and cleanup operations.

## Key files and packages
- `API/src/common/interceptors/logging.interceptor.ts` — Global interceptor that captures all HTTP traffic, sanitizes sensitive fields, determines action/severity, and writes logs asynchronously.
- `API/src/modules/system-log/system-log.service.ts` — Service layer for creating, querying (with filters and pagination), aggregating stats, and cleaning up old logs via Prisma.
- `API/src/modules/system-log/system-log.controller.ts` — Admin-only REST endpoints (`GET /api/v1/system-logs`, `GET /api/v1/system-logs/stats`, `GET /api/v1/system-logs/:id`, `DELETE /api/v1/system-logs/cleanup`).
- `API/src/modules/system-log/dto/system-log.dto.ts` — DTOs and enums (`LogAction`, `LogSeverity`, `CreateLogDto`, `LogFilterDto`, `LogResponseDto`, `LogPaginatedResponseDto`) defining the structured log schema.
- `API/prisma/schema.prisma` — `SystemLog` model with indexed fields (`userId`, `action`, `severity`, `entity+entityId`, `createdAt`, composite indexes) and JSON columns for `details`/`metadata`.
- `src/services/system-log.service.ts` — Frontend service calling the backend log API with typed interfaces (`SystemLog`, `LogFilters`, `LogPaginatedResponse`, `LogStats`).
- `API/src/app.module.ts` — Registers `SystemLogModule` alongside other feature modules.

## Architecture and conventions
- **Automatic capture**: The `LoggingInterceptor` wraps every request, measures duration, extracts IP/User-Agent/authenticated user, and calls `SystemLogService.create()` in a fire-and-forget manner (errors are caught and logged but never bubble up).
- **Structured fields**: Each log record includes action enum, severity level, human-readable message, user identity (id/name/email), affected entity (type/id/name), request context (url, method, statusCode, duration), client info (ipAddress, userAgent), and optional JSON `details`/`metadata`.
- **Sensitive data redaction**: A whitelist of `SENSITIVE_FIELDS` (`password`, `currentPassword`, `newPassword`, `confirmPassword`, `accessToken`, `refreshToken`, `token`) is replaced with `[REDACTED]` before persistence.
- **Endpoint exclusion**: The `/api/v1/system-logs` endpoint itself is excluded from logging to prevent recursive log entries.
- **Action inference**: `determineAction()` maps URL patterns + HTTP methods to `LogAction` values (e.g., `/auth/login` → `LOGIN`/`LOGIN_FAILED`, `/projects` POST → `PROJECT_CREATE`).
- **Severity mapping**: Status codes drive severity: ≥500 → `CRITICAL`, ≥400 → `WARNING`, otherwise `INFO`.
- **Admin-only access**: Log management endpoints require JWT authentication plus `ADMIN` role via `RolesGuard` and `@Roles(Role.ADMIN)`.
- **Prisma-backed storage**: Logs are stored in PostgreSQL via the `SystemLog` model with appropriate indexes for common query patterns (by user, action, severity, date range, entity).
- **Frontend integration**: The React app provides a `LogsPage` and supporting components (`LogFilters`, `LogRow`, `LogStats`, `LogTable`) that consume the backend API through `src/services/system-log.service.ts`.

## Conventions and constraints
- Logs are **immutable** once created — no update or delete of individual records; only bulk cleanup by age is supported.
- All log writes are **non-blocking**; failures to persist do not affect the caller's response.
- The `LogAction` and `LogSeverity` enums must stay synchronized between the TypeScript DTOs and the Prisma schema.
- Only administrators can read or manage logs; regular users cannot access the `/api/v1/system-logs` endpoints.
- Default retention policy removes logs older than 90 days via the `cleanup` endpoint.
- Paginated queries default to 50 items per page with a maximum limit enforced at the DTO level.