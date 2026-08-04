---
kind: error_handling
name: NestJS Global Exception Filter with Standardized Error Responses
category: error_handling
scope:
    - '**'
source_files:
    - API/src/common/filters/http-exception.filter.ts
    - API/src/common/interceptors/transform.interceptor.ts
    - src/services/api.ts
    - src/pages/error/ErrorPage.tsx
    - API/src/config/env.validation.ts
    - API/src/main.ts
---

## Error Handling System Overview

The Windlog application implements a comprehensive error handling strategy using NestJS's built-in exception filtering and interceptor patterns, combined with a dedicated frontend error page for user-friendly error presentation.

### Backend Architecture (NestJS)

**Global Exception Filter**: The `HttpExceptionFilter` in `API/src/common/filters/http-exception.filter.ts` serves as the central error handler, capturing all unhandled exceptions and returning standardized JSON responses. It distinguishes between intentional HTTP exceptions (using NestJS's `HttpException`) and unexpected errors, mapping them to consistent response formats.

**Standard Response Format**: All API responses follow a unified structure defined by the `TransformInterceptor` (`API/src/common/interceptors/transform.interceptor.ts`). Success responses include `{ data, message, statusCode, timestamp }`, while error responses use `{ error, message, statusCode, timestamp, path }`.

**Validation Pipeline**: Global validation via `ValidationPipe` automatically rejects invalid DTOs with 400 status codes, ensuring input validation errors are handled consistently without manual try-catch blocks.

### Frontend Error Handling

**Centralized API Client**: The `api.ts` service (`src/services/api.ts`) handles all HTTP communication, implementing automatic token expiration detection, 401 unauthorized handling with auto-logout, and standardized error propagation through thrown JavaScript errors.

**User-Friendly Error Page**: The `ErrorPage` component (`src/pages/error/ErrorPage.tsx`) provides a polished error interface that maps backend error messages to localized, user-friendly titles and descriptions using i18n keys.

### Key Conventions and Patterns

1. **Exception Hierarchy**: Intentional business logic errors throw `HttpException` with appropriate status codes, while unexpected runtime errors are caught by the global filter and logged with stack traces.

2. **Response Standardization**: Both success and error responses maintain consistent shapes across all endpoints, enabling predictable client-side error handling.

3. **Environment Validation**: The `EnvironmentVariables` class (`API/src/config/env.validation.ts`) enforces configuration validity at startup, failing fast when required environment variables are missing or invalid.

4. **Frontend Error Propagation**: Network errors, authentication failures, and API errors are converted to JavaScript errors that bubble up to component-level handlers or the global error page.

5. **Logging Integration**: All errors are automatically logged through NestJS Logger, with request context (method, URL, status code) captured for debugging purposes.