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
    - src/services/api.ts
    - src/pages/error/ErrorPage.tsx
---

This repository implements a two-layer error handling strategy: a centralized backend using NestJS exception filters and interceptors, paired with a frontend API client that centralizes HTTP error propagation and user-facing error pages.

**Backend (NestJS)**
- A global `HttpExceptionFilter` (`API/src/common/filters/http-exception.filter.ts`) catches every unhandled exception via `@Catch()` and normalizes the response into a consistent shape: `{ error, message, statusCode, timestamp, path }`. For known `HttpException` subclasses (BadRequestException, UnauthorizedException, ConflictException, etc.) it preserves the original status code and message; for unexpected errors it defaults to 500 Internal Server Error and logs the stack trace.
- A global `TransformInterceptor` (`API/src/common/interceptors/transform.interceptor.ts`) wraps every successful controller response into a standard envelope: `{ data, message: 'Success', statusCode, timestamp }`. This is registered in `main.ts` alongside the filter and a logging interceptor.
- DTOs in `API/src/common/dto/api-response.dto.ts` define the TypeScript interfaces `ApiResponse<T>`, `ApiError`, and `PaginatedResponse<T>` that document the expected success/error shapes consumed by the frontend.
- Controllers/services throw NestJS built-in exceptions (`throw new BadRequestException(...)`, `throw new UnauthorizedException(...)`, `throw new ConflictException(...)`) rather than custom error classes. ValidationPipe is configured globally with `whitelist: true` and `forbidNonWhitelisted: true`, so malformed requests are rejected before reaching controllers.
- All error responses include the request URL (`path`) and an ISO-8601 `timestamp`; server-side errors are logged through NestJS Logger with stack traces.

**Frontend (React)**
- `src/services/api.ts` is the single HTTP entry point. It attaches JWT tokens from localStorage, pre-checks token expiry before each request, and handles 401 responses by clearing the token and redirecting to `/error?msg=...` with a deduplication flag (`isLoggingOut`) to prevent concurrent logout loops.
- Non-2xx responses are parsed for the backend's `message` field; if parsing fails the fallback is `HTTP error! status: <code>`. The function throws a plain `Error` with a human-readable message.
- `src/pages/error/ErrorPage.tsx` renders a friendly error page. It maps known raw messages (e.g. `'Token expirado. Faça login novamente.'`, `'Sessão expirada. Faça login novamente.'`, `'Link expirado ou inválido'`, `'Erro ao carregar ficheiro'`) to i18n keys and selects appropriate titles/icons per error category (auth vs file).
- Individual page components use try/catch blocks around async operations and surface errors to the UI or log them; there is no global React error boundary — errors bubble up as thrown Errors from the `api` helper.

**Conventions observed**
- Backend errors are expressed exclusively via NestJS `HttpException` subclasses; custom error types are not used.
- Every API response follows one of two envelopes defined in `api-response.dto.ts`: success (`ApiResponse<T>`) or error (`ApiError`).
- The frontend never calls `fetch` directly outside `api.ts`; all network errors flow through the centralized client.
- 401 unauthorized responses trigger automatic logout and navigation to the shared error page rather than being handled per-call.