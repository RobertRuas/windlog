---
kind: error_handling
name: NestJS Global Exception Filter + Frontend Error Page
category: error_handling
scope:
    - '**'
source_files:
    - API/src/common/filters/http-exception.filter.ts
    - API/src/common/interceptors/transform.interceptor.ts
    - API/src/common/dto/api-response.dto.ts
    - API/src/main.ts
    - src/services/api.ts
    - src/pages/error/ErrorPage.tsx
---

This repository implements a two-layer error handling strategy: a centralized backend error formatter using NestJS's global exception filter, and a dedicated frontend error page for user-facing messages.

**Backend approach (NestJS)**
- A single `HttpExceptionFilter` (`API/src/common/filters/http-exception.filter.ts`) is registered globally in `main.ts` via `app.useGlobalFilters(new HttpExceptionFilter())`. It catches every unhandled exception — whether it is an `HttpException`, a validation error from the global `ValidationPipe`, or any unexpected thrown value — and normalizes the response into a consistent JSON shape: `{ error, message, statusCode, timestamp, path }`. For non-`HttpException` cases it maps to HTTP 500 with `error: 'InternalServerError'` and logs the full stack trace through NestJS Logger.
- Successful responses are wrapped by `TransformInterceptor` (`API/src/common/interceptors/transform.interceptor.ts`), also registered globally, which rewrites every controller return into `{ data, message: 'Success', statusCode, timestamp }`. The DTOs `ApiResponse<T>` and `ApiError` in `api-response.dto.ts` document these shapes for both success and error payloads.
- Controllers/services throw NestJS built-in exceptions (`BadRequestException`, `UnauthorizedException`, `ConflictException`, etc.) rather than custom error classes; the filter then translates them into the standardized error envelope. Validation errors produced by the global `ValidationPipe` flow through the same filter.
- There is no use of `try/catch` blocks around service calls as a primary pattern; instead, domain-specific business errors are expressed by throwing the appropriate NestJS `HttpException` subclass, letting the global filter handle formatting and logging uniformly.

**Frontend approach (React)**
- All HTTP calls go through a single `apiRequest` helper in `src/services/api.ts`. It attaches the JWT token, pre-validates token expiry before sending, and centralizes error propagation:
  - On 401 it performs automatic logout (clears `accessToken` from localStorage) and redirects to `/error?msg=...` with a human-readable message, guarding against concurrent logout attempts via an `isLoggingOut` flag.
  - On other non-OK responses it parses the body (falling back to an empty object) and throws an `Error` whose `message` comes from the backend's normalized `message` field.
- User-facing errors are rendered by `src/pages/error/ErrorPage.tsx`, a terminal-styled page that maps known backend messages (e.g. `'Token não fornecido'`, `'Sessão expirada'`, `'Link expirado ou inválido'`) to i18n keys and displays a status code (401 vs 404 for file-related errors). Navigation buttons allow going back or returning to login.

**Architecture & conventions**
- Errors are never returned as plain objects from controllers; they are always thrown as NestJS exceptions so the global filter can guarantee a uniform envelope.
- The success/error response envelopes are defined once (`StandardResponse` in the interceptor, `ApiResponse`/`ApiError` in the DTO file) and consumed consistently across the API surface.
- Logging is dual: the backend logs every caught exception (including stack traces for unexpected errors) and every successful request via the transform/logging interceptors; the frontend surfaces only the message string to the user through the error page.
- No custom error class hierarchy exists on the backend; the convention is to pick the most specific NestJS `HttpException` subclass at the point of failure.