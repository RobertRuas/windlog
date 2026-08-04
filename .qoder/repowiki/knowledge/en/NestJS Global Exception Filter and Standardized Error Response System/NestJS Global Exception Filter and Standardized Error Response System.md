---
kind: error_handling
name: NestJS Global Exception Filter and Standardized Error Response System
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

## What system/approach is used

The Windlog API uses NestJS's built-in exception filtering and interceptor architecture to implement a centralized, standardized error handling strategy. The system relies on three core mechanisms:

1. **Global Exception Filter** (`HttpExceptionFilter`) - Catches all unhandled exceptions and returns consistent JSON error responses
2. **Global Transform Interceptor** (`TransformInterceptor`) - Wraps all successful responses in a standardized format
3. **Frontend API Client** with automatic 401 handling and user-friendly error pages

## Key files and packages

- `API/src/common/filters/http-exception.filter.ts` - Central exception filter that normalizes all error responses
- `API/src/common/interceptors/transform.interceptor.ts` - Success response transformer with standard envelope
- `API/src/common/dto/api-response.dto.ts` - TypeScript interfaces defining `ApiResponse<T>`, `ApiError`, and `PaginatedResponse<T>`
- `API/src/main.ts` - Bootstrap configuration registering global filters and interceptors
- `src/services/api.ts` - Frontend HTTP client with automatic token expiration handling
- `src/pages/error/ErrorPage.tsx` - User-friendly error page with i18n support

## Architecture and conventions

### Backend Error Flow

All errors follow this path:
1. Controllers/services throw NestJS built-in exceptions (`BadRequestException`, `UnauthorizedException`, `NotFoundException`, `ConflictException`)
2. `HttpExceptionFilter` catches all exceptions globally
3. For `HttpException` instances: extracts status code, message, and error name from the exception response
4. For unexpected errors: returns 500 status with generic "Internal server error" message and logs the full stack trace
5. All error responses follow the `ApiError` interface structure: `{ error, message, statusCode, timestamp, path }`

### Success Response Standardization

All successful responses are wrapped by `TransformInterceptor` into the `StandardResponse<T>` format: `{ data, message: 'Success', statusCode, timestamp }`

### Frontend Error Handling

The frontend `api.ts` client implements:
- Automatic JWT token expiration detection before requests
- Centralized 401 handling that clears localStorage and redirects to `/error?msg=...`
- Consistent error throwing for non-2xx responses using the backend's error message
- A dedicated error page with friendly messaging and i18n support

### Validation Pipeline

Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` automatically validates DTOs and returns 400 errors for invalid input, which are then caught by the exception filter.

## Conventions and constraints

**Exception Usage Pattern**: Services consistently throw NestJS built-in exceptions rather than custom error classes. Examples include `throw new UnauthorizedException('User not found')`, `throw new NotFoundException('Feedback not found')`, and `throw new ConflictException('Email already registered')`.

**Response Format Enforcement**: The global transform interceptor ensures all successful responses follow the same structure, while the exception filter guarantees consistent error formatting regardless of where exceptions originate.

**Security Considerations**: Unexpected errors (non-HttpException) are logged with full stack traces but return only generic messages to clients, preventing information leakage.

**Token Management**: The frontend automatically handles session expiration by detecting expired tokens before making requests and clearing authentication state when receiving 401 responses.

**Logging Strategy**: Both success and error requests are logged through the logging interceptor and exception filter, providing comprehensive request/response tracking for debugging.