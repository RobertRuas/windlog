---
kind: error_handling
name: NestJS Global Exception Filter with Standardized Error Responses and Frontend Unauthorized Handling
category: error_handling
scope:
    - '**'
source_files:
    - API/src/common/filters/http-exception.filter.ts
    - API/src/common/interceptors/transform.interceptor.ts
    - API/src/main.ts
    - API/src/common/dto/api-response.dto.ts
    - src/services/api.ts
    - src/pages/error/ErrorPage.tsx
---

The Windlog platform implements a centralized, two-layer error handling strategy: a NestJS backend that standardizes all HTTP error responses through a global exception filter, and a React frontend that handles authentication failures and displays errors through a dedicated terminal-styled error page.

**Backend Architecture**

All server-side errors are funneled through `API/src/common/filters/http-exception.filter.ts`, a global `@Catch()` filter registered in `main.ts` via `app.useGlobalFilters(new HttpExceptionFilter())`. This filter intercepts every unhandled exception — whether from `HttpException`, validation pipes, or unexpected runtime errors — and returns a uniform JSON structure:
```
{
  "error": "BadRequest|NotFound|InternalServerError",
  "message": "Human-readable description",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/..."
}
```

For intentional business errors, controllers throw `HttpException` instances (from `@nestjs/common`) with appropriate status codes and messages. For unexpected errors (database failures, null references, etc.), the filter defaults to `500 Internal Server Error` with an `InternalServerError` error name and logs the full stack trace via NestJS Logger.

Successful responses are standardized by `API/src/common/interceptors/transform.interceptor.ts`, which wraps every controller return value into a consistent shape:
```
{
  "data": <controller return value>,
  "message": "Success",
  "statusCode": 200,
  "timestamp": "ISO timestamp"
}
```

Validation errors from DTOs are handled automatically by the global `ValidationPipe` configured in `main.ts` with `whitelist: true` and `forbidNonWhitelisted: true`, which strips unknown fields and returns 400 errors through the same `HttpExceptionFilter`.

**Frontend Error Handling**

The frontend centralizes HTTP communication through `src/services/api.ts`, which wraps `fetch` calls and implements automatic logout on 401 responses. When a 401 is detected (expired or invalid JWT), it removes the token from `localStorage`, sets a guard flag (`isLoggingOut`) to prevent concurrent logout attempts, and redirects to `/error?msg=Token+n%C3%A3o+fornecido` using `window.location.href` for a full-page reload.

Other non-OK responses (4xx/5xx) are parsed for the `message` field from the backend's standardized error response and re-thrown as JavaScript `Error` objects with descriptive messages.

The `src/pages/error/ErrorPage.tsx` renders a retro terminal-style error screen that maps known backend error messages to i18n keys via a `KNOWN_MESSAGES` dictionary. It determines the displayed status code based on the message content (401 for auth errors, 404 for file/link errors) and provides navigation actions to go back or return to login.

**Conventions Observed**

- Backend controllers should throw `HttpException` for all business logic errors rather than returning error objects manually; the global interceptor/filter handles formatting.
- All API responses follow the `ApiResponse<T>` and `ApiError` interfaces defined in `API/src/common/dto/api-response.dto.ts`, ensuring type safety across the stack.
- Frontend services never handle 401 locally — they delegate to the centralized `handleUnauthorized()` function in `api.ts`.
- Unknown/unexpected exceptions on the backend are always logged with stack traces and returned as 500 errors to clients.
- The frontend uses try/catch blocks around individual service calls (e.g., in `ProfileWizard.tsx`, `AvatarUpload.tsx`, `LoginForm.tsx`) to display user-facing error messages, typically via toast notifications.