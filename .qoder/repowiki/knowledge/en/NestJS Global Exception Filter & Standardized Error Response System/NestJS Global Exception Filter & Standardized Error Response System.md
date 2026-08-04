---
kind: error_handling
name: NestJS Global Exception Filter & Standardized Error Response System
category: error_handling
scope:
    - '**'
source_files:
    - API/src/common/filters/http-exception.filter.ts
    - API/src/common/interceptors/transform.interceptor.ts
    - API/src/common/dto/api-response.dto.ts
    - API/src/main.ts
    - API/src/config/env.validation.ts
    - src/services/api.ts
    - src/pages/error/ErrorPage.tsx
---

This repository implements a centralized error handling system built around NestJS's global exception filter and interceptor architecture, with consistent error response formatting on both backend and frontend.

**Backend Architecture (NestJS)**

The core of the error handling system is the `HttpExceptionFilter` (`API/src/common/filters/http-exception.filter.ts`), which catches all unhandled exceptions and returns standardized JSON responses. The filter distinguishes between intentional `HttpException` instances (which preserve their status codes and messages) and unexpected errors (which default to 500 Internal Server Error). All errors are logged with request context (method, URL, status code) using NestJS Logger.

Global configuration in `main.ts` registers:
- `HttpExceptionFilter` via `app.useGlobalFilters()` for unified error responses
- `TransformInterceptor` via `app.useGlobalInterceptors()` for standardized success responses
- `LoggingInterceptor` for request/response logging
- `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` for input validation

The standardized response format is defined in `api-response.dto.ts`:
- Success: `{ data, message, statusCode, timestamp }`
- Error: `{ error, message, statusCode, timestamp, path }`
- Paginated: `{ data[], meta: { total, page, limit, totalPages } }`

Environment validation uses `class-validator` decorators in `env.validation.ts` with fail-fast behavior — the application refuses to start if required environment variables are missing or invalid.

**Frontend Error Handling**

The frontend centralizes HTTP error handling in `src/services/api.ts`, which wraps all API calls through a single `apiRequest` function. Key behaviors include:
- Automatic JWT expiration detection before requests are sent
- 401 Unauthorized responses trigger automatic logout and redirect to `/error?msg=...`
- Non-OK responses throw JavaScript Errors with descriptive messages extracted from the API error response
- Protection against multiple simultaneous logout attempts via an `isLoggingOut` flag

Error presentation is handled by `src/pages/error/ErrorPage.tsx`, a terminal-styled error page that accepts error messages via URL parameters and maps them to i18n keys through a `KNOWN_MESSAGES` dictionary. The page displays appropriate HTTP status codes (401 for authentication errors, 404 for file-related errors) based on the error type.

**Conventions Observed**

- All backend errors use NestJS `HttpException` with descriptive messages
- Validation errors are automatically caught by the global `ValidationPipe` and formatted consistently
- Environment variable validation prevents runtime failures due to missing configuration
- Frontend errors propagate as JavaScript Errors with user-friendly messages
- Authentication errors follow a specific flow: detect → clear token → redirect to error page
- All responses (success and error) include timestamps for debugging
- Error paths are captured in error responses for traceability