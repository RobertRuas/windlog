---
kind: error_handling
name: NestJS Global Exception Filter + Frontend Error Handling
category: error_handling
scope:
    - '**'
source_files:
    - API/src/common/filters/http-exception.filter.ts
    - API/src/main.ts
    - API/src/common/dto/api-response.dto.ts
    - API/src/common/dto/swagger-response.dto.ts
    - src/services/api.ts
    - src/pages/error/ErrorPage.tsx
---

This repository implements a two-layer error handling strategy: a centralized NestJS backend filter that normalizes all HTTP errors into a consistent JSON shape, and a React frontend service that centralizes fetch-level error propagation and session expiration handling.

**Backend (NestJS)**
- A global `HttpExceptionFilter` (`API/src/common/filters/http-exception.filter.ts`) is registered via `app.useGlobalFilters(new HttpExceptionFilter())` in `main.ts`. It catches every unhandled exception (`@Catch()` with no type) and returns a uniform `{ error, message, statusCode, timestamp, path }` object. For `HttpException` instances it extracts the status and response body; for unexpected errors it defaults to 500 Internal Server Error and logs the stack.
- Controllers/services throw NestJS built-in exceptions (`BadRequestException`, `UnauthorizedException`, `ConflictException`, `NotFoundException`, etc.) rather than custom error classes. The filter maps these to the standardized response shape.
- Validation errors are handled by the global `ValidationPipe` configured in `main.ts` with `whitelist: true` and `forbidNonWhitelisted: true`, which automatically rejects unknown fields and returns 400 Bad Request.
- Success responses are normalized through a separate `TransformInterceptor` (`API/src/common/interceptors/transform.interceptor.ts`) so both success and error paths follow a consistent contract.
- DTOs define the expected shapes: `ApiResponse<T>` and `ApiError` in `api-response.dto.ts`, plus Swagger `SuccessResponseDto` / `ErrorResponseDto` classes in `swagger-response.dto.ts` used for OpenAPI documentation.

**Frontend (React)**
- All HTTP calls go through a single `apiRequest` function in `src/services/api.ts`. It:
  - Attaches the JWT `Authorization` header when present.
  - Pre-checks token expiry before sending requests and throws a descriptive error if expired.
  - On 401 responses, clears `accessToken` from localStorage, sets an `isLoggingOut` guard against concurrent logout loops, and redirects to `/error?msg=...`.
  - On other non-ok responses, parses the error JSON body and re-throws as a plain `Error` with the server's `message` field or a fallback `HTTP error! status: <code>` string.
- The dedicated `ErrorPage` component (`src/pages/error/ErrorPage.tsx`) renders a terminal-style screen for known error messages mapped via a `KNOWN_MESSAGES` dictionary, translating them through i18n keys.
- Individual feature services (`auth.service.ts`, `project.service.ts`, etc.) call the shared `api` helper and let errors bubble up; there is no per-service try/catch wrapper, keeping error handling centralized.

**Conventions observed**
- Backend: prefer NestJS built-in `HttpException` subclasses thrown directly from services/controllers; do not create custom error classes.
- Backend: never return raw errors from controllers — rely on the global filter to format responses.
- Frontend: never call `fetch` directly outside `src/services/api.ts`; always use the typed `api.get/post/put/patch/delete` helpers.
- Frontend: treat any thrown `Error` from the API layer as a user-facing failure and surface it through the shared error page or component-level UI feedback.