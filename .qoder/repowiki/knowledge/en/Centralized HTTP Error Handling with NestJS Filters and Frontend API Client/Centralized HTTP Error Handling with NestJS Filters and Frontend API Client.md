---
kind: error_handling
name: Centralized HTTP Error Handling with NestJS Filters and Frontend API Client
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

The Windlog application implements a centralized, two-layer error handling strategy: a NestJS backend that standardizes all HTTP responses through global filters and interceptors, and a React frontend that centralizes API error propagation through a single HTTP client.

**Backend approach (NestJS)**
- A global `HttpExceptionFilter` (`API/src/common/filters/http-exception.filter.ts`) catches every unhandled exception via `@Catch()` and returns a uniform JSON shape: `{ error, message, statusCode, timestamp, path }`. For `HttpException` instances it preserves the original status code and message; for unexpected errors it defaults to 500 Internal Server Error and logs the full stack.
- A global `TransformInterceptor` (`API/src/common/interceptors/transform.interceptor.ts`) wraps every successful controller response into `{ data, message: 'Success', statusCode, timestamp }`, ensuring consistent success payloads across all endpoints.
- Both are registered in `main.ts` via `app.useGlobalFilters(new HttpExceptionFilter())` and `app.useGlobalInterceptors(new TransformInterceptor())`, so no per-controller or per-route wiring is needed.
- DTO validation errors are handled by a global `ValidationPipe` configured with `whitelist: true` and `forbidNonWhitelisted: true`, which automatically rejects requests containing unknown fields and converts types where possible.
- Environment configuration failures are caught at startup by `EnvironmentVariables` (`API/src/config/env.validation.ts`) using `class-validator` decorators; missing or invalid env vars cause an immediate fail-fast boot failure rather than runtime surprises.
- The standardized response/error shapes are typed as `ApiResponse<T>`, `ApiError`, and `PaginatedResponse<T>` in `API/src/common/dto/api-response.dto.ts`, and documented in the Swagger OpenAPI spec generated in `main.ts`.

**Frontend approach (React/Vite)**
- All HTTP calls go through a single `apiRequest` function in `src/services/api.ts`. It attaches JWT tokens from `localStorage`, throws on non-`response.ok`, and maps 401 responses to automatic logout + redirect to `/error?msg=...`.
- Known error messages from the backend are mapped to i18n keys via a `KNOWN_MESSAGES` table, and a dedicated `ErrorPage` component (`src/pages/error/ErrorPage.tsx`) renders friendly, localized error screens for auth/session/file-load failures.
- The frontend does not use a dedicated error-type hierarchy; instead it relies on thrown `Error` objects carrying human-readable messages extracted from the backend's standardized `{ message }` field.

**Architecture and conventions**
- Errors flow upward as exceptions on the server and as thrown `Error`s on the client; there is no custom error class hierarchy. Business logic controllers throw NestJS `HttpException` (or rely on ValidationPipe) and let the global filter serialize them.
- Success paths are never left raw — every response is wrapped by the transform interceptor, so consumers always receive the same envelope.
- Logging is built-in: the exception filter logs both the request context and the error stack; the logging interceptor records successful requests through `SystemLogService`.

**Conventions and constraints observed**
- Every endpoint must return data that can be wrapped by `StandardResponse<T>`; throwing anything other than `HttpException` results in a 500 with a generic message.
- Request bodies must conform to declared DTOs; extra fields are stripped and rejected at the pipe level.
- 401 responses on the client trigger an idempotent logout flow guarded by an `isLoggingOut` flag to prevent concurrent logout loops.
- The frontend error page only recognizes a small set of known backend messages; any unrecognized message falls back to displaying the raw string.