---
kind: error_handling
name: NestJS Global Exception Filter and Standardized Error Responses
category: error_handling
scope:
    - '**'
source_files:
    - API/src/common/filters/http-exception.filter.ts
    - API/src/common/interceptors/transform.interceptor.ts
    - API/src/common/dto/api-response.dto.ts
    - API/src/config/env.validation.ts
    - src/services/api.ts
    - src/pages/error/ErrorPage.tsx
    - API/src/main.ts
---

## Error Handling Architecture

The Windlog application implements a comprehensive, centralized error handling system built on NestJS's exception filter pattern with standardized response formats across both backend and frontend.

### Backend Error Handling System

**Global Exception Filter**: The `HttpExceptionFilter` in `API/src/common/filters/http-exception.filter.ts` captures all unhandled exceptions and returns consistent JSON responses. It handles both intentional `HttpException` instances (business logic errors) and unexpected errors (bugs, database failures), logging the latter with full stack traces for debugging.

**Standard Response Format**: All API responses follow a unified structure defined in `API/src/common/dto/api-response.dto.ts`:
- Success responses: `{ data, message, statusCode, timestamp }`
- Error responses: `{ error, message, statusCode, timestamp, path }`
- Paginated responses: `{ data, meta: { total, page, limit, totalPages } }`

**Response Transformation**: The `TransformInterceptor` wraps all successful controller responses in the standard format automatically, ensuring consistency without manual wrapping in each controller.

**Validation Pipeline**: Global `ValidationPipe` configuration enforces DTO validation with strict whitelisting (`forbidNonWhitelisted: true`, `whitelist: true`), automatically returning 400 errors for invalid input.

**Environment Validation**: The `EnvironmentVariables` class uses class-validator decorators to validate required environment variables at startup, implementing a fail-fast strategy that prevents the application from starting with missing or invalid configuration.

### Frontend Error Handling

**Centralized HTTP Client**: The `api.ts` service in `src/services/api.ts` provides a single entry point for all API calls with built-in error handling:
- Automatic JWT token management and expiration detection
- Centralized 401 Unauthorized handling with automatic logout and redirect
- Consistent error message extraction from backend responses
- Protection against multiple simultaneous logout attempts

**User-Friendly Error Page**: The `ErrorPage.tsx` component displays localized, friendly error messages with appropriate icons and navigation options. It maps backend error messages to i18n keys and provides contextual actions (go back, login).

### Conventions and Patterns

**Exception Types**: Controllers and services throw specific NestJS exceptions (`BadRequestException`, `UnauthorizedException`, `NotFoundException`, `ConflictException`) rather than generic errors, enabling proper HTTP status code mapping.

**Error Propagation**: Errors flow through the global filter pipeline, ensuring consistent formatting and logging regardless of where they originate in the application.

**Client-Side Error Mapping**: The frontend maintains a `KNOWN_MESSAGES` mapping that translates backend error messages into user-friendly, localized content.

**Security Considerations**: Detailed error information (stack traces, internal details) is only logged server-side; client-facing error messages are sanitized and user-appropriate.

### Key Files

- `API/src/common/filters/http-exception.filter.ts` - Global exception handler
- `API/src/common/interceptors/transform.interceptor.ts` - Response formatter
- `API/src/common/dto/api-response.dto.ts` - Response type definitions
- `API/src/config/env.validation.ts` - Environment validation
- `src/services/api.ts` - Frontend HTTP client with error handling
- `src/pages/error/ErrorPage.tsx` - User-facing error display
- `API/src/main.ts` - Global error handling setup