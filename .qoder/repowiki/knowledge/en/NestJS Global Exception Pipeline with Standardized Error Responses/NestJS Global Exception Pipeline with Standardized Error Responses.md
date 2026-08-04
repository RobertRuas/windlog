---
kind: error_handling
name: NestJS Global Exception Pipeline with Standardized Error Responses
category: error_handling
scope:
    - '**'
source_files:
    - API/src/common/filters/http-exception.filter.ts
    - API/src/common/interceptors/transform.interceptor.ts
    - API/src/common/interceptors/logging.interceptor.ts
    - API/src/main.ts
    - API/src/config/env.validation.ts
    - src/services/api.ts
    - src/pages/error/ErrorPage.tsx
---

The Windlog platform implements a centralized, layered error handling strategy built on NestJS's exception pipeline, combining global filters, interceptors, and frontend middleware to produce consistent error responses across the API and user experience.

**Backend Error Architecture**

At the core is `HttpExceptionFilter` (`API/src/common/filters/http-exception.filter.ts`), a global `@Catch()` filter registered in `main.ts` via `app.useGlobalFilters()`. It captures all unhandled exceptions — both intentional `HttpException` instances thrown by controllers/services and unexpected errors — and normalizes them into a uniform JSON shape: `{ error, message, statusCode, timestamp, path }`. For `HttpException`, it extracts status code and message from the exception response (supporting both string and object forms); for unknown errors, it defaults to HTTP 500 with `InternalServerError` and logs the full stack trace via NestJS Logger.

Successful responses are standardized through `TransformInterceptor` (`API/src/common/interceptors/transform.interceptor.ts`), also registered globally. Every controller return value is wrapped into `{ data, message: 'Success', statusCode, timestamp }`, ensuring the frontend always receives a predictable envelope.

Error logging is handled by `LoggingInterceptor` (`API/src/common/interceptors/logging.interceptor.ts`), which runs alongside the transform interceptor. It captures request metadata (method, URL, IP, user-agent, duration, status code) and persists structured audit logs through `SystemLogService`, redacting sensitive fields like passwords and tokens before storage. Failed requests are logged with `LogAction.API_ERROR` and `LogSeverity.ERROR`, while successful ones use context-specific actions derived from URL patterns.

Validation errors flow through NestJS's global `ValidationPipe` configured in `main.ts` with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`, automatically rejecting malformed DTOs with 400 responses that still pass through `HttpExceptionFilter` for consistent formatting.

Environment validation uses `class-validator` decorators in `EnvironmentVariables` (`API/src/config/env.validation.ts`) with a fail-fast startup strategy — missing or invalid env vars prevent application boot rather than causing runtime crashes.

**Frontend Error Handling**

The React frontend centralizes HTTP error logic in `src/services/api.ts`. The `apiRequest` function wraps all fetch calls, automatically attaching JWT tokens, pre-checking token expiration before sending requests, and handling 401 responses by clearing localStorage and redirecting to `/error?msg=Token+não+fornecido`. Non-2xx responses throw JavaScript Errors with messages extracted from the backend's standardized `{ message }` field.

A dedicated `ErrorPage` component (`src/pages/error/ErrorPage.tsx`) renders user-friendly error screens mapped from known backend messages via a `KNOWN_MESSAGES` lookup table, translating technical messages into localized, friendly titles and descriptions using i18n keys. Auth-related errors show a lock icon and login button; file-related errors show a cloud icon with appropriate messaging.

**Conventions Observed**

- All API errors follow the `{ error, message, statusCode, timestamp, path }` shape enforced by the global filter.
- All successful responses follow the `{ data, message, statusCode, timestamp }` envelope from the transform interceptor.
- Sensitive data (passwords, tokens) is never logged — sanitized via `SENSITIVE_FIELDS` filtering in the logging interceptor.
- Validation failures are caught at the pipe level before reaching controllers, producing consistent 400 responses.
- Frontend treats any non-2xx response as an error, extracting the `message` field from the backend response.
- 401 responses trigger automatic logout and redirect to the error page with a contextual message parameter.
- Environment configuration is validated at startup with clear error messages for missing variables.