---
kind: error_handling
name: Error Handling — NestJS Global Filter, Standardized API Responses, and React Error Pages
category: error_handling
scope:
    - '**'
source_files:
    - API/src/common/filters/http-exception.filter.ts
    - API/src/common/interceptors/transform.interceptor.ts
    - API/src/common/dto/api-response.dto.ts
    - API/src/config/env.validation.ts
    - API/src/main.ts
    - src/services/api.ts
    - src/pages/error/ErrorPage.tsx
---

This repository implements a two-layer error handling strategy: a centralized backend error pipeline in NestJS that normalizes all HTTP errors into a consistent JSON shape, and a frontend error display layer that surfaces user-friendly messages for authentication and network failures.

**Backend (NestJS)**
- A global `HttpExceptionFilter` (`API/src/common/filters/http-exception.filter.ts`) catches every unhandled exception via `@Catch()` with no type filter. For `HttpException` instances it extracts the status code and message; for any other thrown value it maps to `500 Internal Server Error`, logs the stack, and returns a uniform `{ error, message, statusCode, timestamp, path }` body.
- A global `TransformInterceptor` (`API/src/common/interceptors/transform.interceptor.ts`) wraps every successful controller response into `{ data, message: 'Success', statusCode, timestamp }`, so success and error responses are symmetric.
- `main.ts` registers both as global middleware via `app.useGlobalFilters(new HttpExceptionFilter())` and `app.useGlobalInterceptors(new TransformInterceptor())`, ensuring no route can bypass them.
- Controllers/services throw NestJS built-in exceptions (`BadRequestException`, `UnauthorizedException`, `ConflictException`, etc.) rather than custom error classes; validation is enforced globally through `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`, which automatically produces 400 responses for malformed DTOs.
- Environment configuration validation (`API/src/config/env.validation.ts`) uses class-validator decorators on an `EnvironmentVariables` class so missing or invalid `.env` values cause the app to fail fast at startup.
- The Swagger/OpenAPI setup documents both the success shape (`ApiResponse<T>`) and the error shape (`ApiError`) from `API/src/common/dto/api-response.dto.ts`, making the contract explicit for consumers.

**Frontend (React)**
- All HTTP calls go through a single `apiRequest` helper in `src/services/api.ts`. It attaches the JWT `Authorization` header, detects expired tokens before sending, and handles 401 by clearing `localStorage.accessToken` and redirecting to `/error?msg=...`. Non-ok responses parse the backend error body and rethrow a plain `Error` with the server message or a fallback `HTTP error! status: ${response.status}`.
- Each page using TanStack Query (`useQuery`, `useMutation`) provides an `onError` callback to surface failures locally (e.g., toast notifications or UI state), while the central `api` layer handles auth-specific flows.
- A dedicated `ErrorPage` component (`src/pages/error/ErrorPage.tsx`) renders friendly, localized error screens. It accepts a `?msg=` URL parameter, maps known raw messages (token missing, session expired, link expired, file load error) to i18n keys, and shows appropriate icons and titles per error category.

**Conventions and constraints observed**
- Backend errors are always thrown as NestJS `HttpException` subclasses; there are no custom error types defined in this repo.
- Every HTTP response follows one of two shapes documented in `api-response.dto.ts`: success `{ data, message, statusCode, timestamp }` or error `{ error, message, statusCode, timestamp, path }`.
- Validation errors are not handled per-endpoint; they are caught globally by `ValidationPipe` and surfaced through the same `HttpExceptionFilter`.
- Frontend error propagation is centralized in `src/services/api.ts`; pages should not implement their own fetch logic outside this helper.
- Auth failures (401) trigger automatic logout and navigation to the shared error page rather than being handled per-request.