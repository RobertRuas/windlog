---
kind: error_handling
name: NestJS Global Exception Filter + Standardized API Error Contracts
category: error_handling
scope:
    - '**'
source_files:
    - API/src/common/filters/http-exception.filter.ts
    - API/src/common/interceptors/transform.interceptor.ts
    - API/src/common/dto/api-response.dto.ts
    - API/src/main.ts
    - API/src/common/interceptors/logging.interceptor.ts
    - src/services/api.ts
    - src/pages/error/ErrorPage.tsx
---

The Windlog application implements a centralized, NestJS-native error handling strategy built around a global exception filter, standardized response contracts, and coordinated frontend error presentation.

**Backend approach**
- A single `HttpExceptionFilter` (`API/src/common/filters/http-exception.filter.ts`) is registered globally in `main.ts` via `app.useGlobalFilters(new HttpExceptionFilter())`. It catches every unhandled exception: Nest `HttpException` subclasses (e.g. `UnauthorizedException`, `BadRequestException`, `ConflictException`) are mapped to their HTTP status and message; any other thrown value falls back to `500 Internal Server Error` with an `InternalServerError` error name and logs the full stack.
- All successful responses are wrapped by `TransformInterceptor` (`API/src/common/interceptors/transform.interceptor.ts`), also registered globally in `main.ts`. Every controller return value is transformed into `{ data, message: 'Success', statusCode, timestamp }`.
- The shared contract types live in `API/src/common/dto/api-response.dto.ts`: `ApiResponse<T>` for success payloads, `ApiError` for error payloads (`error`, `message`, `statusCode`, `timestamp`, `path`), and `PaginatedResponse<T>` for list endpoints.
- Validation errors from DTOs flow through Nest's global `ValidationPipe` (configured in `main.ts` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`) and are caught by the same `HttpExceptionFilter`, producing consistent 4xx error bodies.
- Controllers/services throw domain-specific exceptions using Nest's built-in classes (`UnauthorizedException`, `BadRequestException`, `ConflictException`, etc.) rather than custom error objects, keeping propagation uniform.
- A separate `LoggingInterceptor` (`API/src/common/interceptors/logging.interceptor.ts`) runs alongside the transform interceptor, sanitizing sensitive fields (passwords, tokens) and persisting structured logs via `SystemLogService` before the response is sent.

**Frontend approach**
- A thin `apiRequest` wrapper in `src/services/api.ts` centralizes fetch calls, attaches the JWT `Authorization` header, and handles two error cases uniformly:
  - `401 Unauthorized` triggers automatic logout (`localStorage.removeItem('accessToken')`) and redirects to `/error?msg=Token+não+fornecido`.
  - Any non-`ok` response throws an `Error` whose message comes from the backend's `ApiError.message` field.
- The dedicated `ErrorPage` component (`src/pages/error/ErrorPage.tsx`) renders a user-friendly, i18n-localized screen. It maps known backend messages (token missing, expired session, invalid link, file load error) to friendly titles and icons, and offers "Back" / "Login" actions.

**Architecture and conventions**
- Error shape is enforced at both ends: the backend always emits `ApiError` via the global filter; the frontend expects that shape and surfaces it through the unified `ErrorPage`.
- No `throw new Error(...)` is used on the backend for HTTP semantics — only Nest `HttpException` subclasses, ensuring predictable status codes.
- Logging is decoupled from error shaping: `LoggingInterceptor` records requests/responses asynchronously without blocking, while `HttpExceptionFilter` logs the final error line after formatting.
- Sensitive data is never logged: the logging interceptor redacts password/token fields before persistence.

**Conventions observed**
- Throw Nest `HttpException` subclasses for all client/server error conditions; do not return raw `Error` objects from controllers.
- Do not catch and rethrow inside services unless you need to add context — let the global filter handle formatting.
- Frontend code should never display raw backend messages directly; route them through `ErrorPage` which translates them via i18n keys.
- All API responses must conform to `ApiResponse<T>` or `ApiError`; pagination uses `PaginatedResponse<T>`.