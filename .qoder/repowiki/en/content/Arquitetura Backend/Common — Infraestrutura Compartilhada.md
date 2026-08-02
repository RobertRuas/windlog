# Common — Infraestrutura Compartilhada

<cite>
**Referenced Files in This Document**
- [current-user.decorator.ts](file://API/src/common/decorators/current-user.decorator.ts)
- [roles.decorator.ts](file://API/src/common/decorators/roles.decorator.ts)
- [roles.guard.ts](file://API/src/common/guards/roles.guard.ts)
- [http-exception.filter.ts](file://API/src/common/filters/http-exception.filter.ts)
- [logging.interceptor.ts](file://API/src/common/interceptors/logging.interceptor.ts)
- [transform.interceptor.ts](file://API/src/common/interceptors/transform.interceptor.ts)
- [pagination.dto.ts](file://API/src/common/dto/pagination.dto.ts)
- [api-response.dto.ts](file://API/src/common/dto/api-response.dto.ts)
- [index.ts](file://API/src/common/index.ts)
</cite>

## Table of Contents
1. Decorators (@CurrentUser, @Roles)
2. Guards (RolesGuard, JwtAuthGuard)
3. Filters (HttpExceptionFilter)
4. Interceptors (LoggingInterceptor, TransformInterceptor)
5. DTOs Comuns (PaginationDto, ApiResponseDto)
6. Utilitários (formatDate, buildPaginationMeta)

## Decorators (@CurrentUser, @Roles)

### @CurrentUser Decorator
The `@CurrentUser` decorator is responsible for extracting user information from the JWT token payload and injecting it into controller methods. It follows NestJS best practices for custom decorators by using a factory function pattern.

**Key Features:**
- Extracts user data from JWT payload containing `{ sub: userId, email, role }`
- Provides type-safe access to authenticated user context
- Integrates with NestJS dependency injection system
- Supports optional parameter binding

**Usage Pattern:**
```typescript
@Controller('users')
export class UsersController {
  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.userService.getProfile(user.sub);
  }
}
```

### @Roles Decorator
The `@Roles` decorator implements role-based access control (RBAC) at the method level. It accepts an array of allowed roles and works in conjunction with the RolesGuard for authorization.

**Supported Roles:**
- `ADMIN`: Full system access
- `HR`: Human resources management capabilities  
- `STANDARD`: Restricted access with basic functionality

**Implementation Details:**
- Accepts multiple roles as parameters
- Validates against predefined role constants
- Works with metadata system for runtime checks
- Compatible with NestJS execution context

**Section sources**
- [current-user.decorator.ts](file://API/src/common/decorators/current-user.decorator.ts)
- [roles.decorator.ts](file://API/src/common/decorators/roles.decorator.ts)

## Guards (RolesGuard, JwtAuthGuard)

### RolesGuard
The `RolesGuard` is a NestJS guard that enforces role-based authorization. It checks if the current user has one of the required roles defined via the `@Roles()` decorator.

**Authorization Flow:**
1. Retrieves required roles from method metadata
2. Extracts user object from request context
3. Compares user role against allowed roles
4. Throws UnauthorizedException if access denied

**Security Considerations:**
- Always validates user existence before role checking
- Uses strict equality comparison for role validation
- Integrates with global exception handling
- Supports both single and multiple role requirements

### JwtAuthGuard
The `JwtAuthGuard` extends NestJS's built-in authentication guard to validate JWT tokens. It ensures that requests contain valid Bearer tokens with proper claims.

**Token Validation Process:**
- Validates JWT signature and expiration
- Extracts user claims from token payload
- Attaches validated user to request context
- Handles token-related errors gracefully

**Integration Points:**
- Works with Passport.js strategy configuration
- Compatible with session-based authentication
- Supports token refresh mechanisms
- Logs authentication attempts for security monitoring

**Section sources**
- [roles.guard.ts](file://API/src/common/guards/roles.guard.ts)

## Filters (HttpExceptionFilter)

### HttpExceptionFilter
The `HttpExceptionFilter` provides centralized error handling across all API endpoints. It transforms various exception types into consistent HTTP responses following the application's error response format.

**Error Response Format:**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/users"
}
```

**Exception Types Handled:**
- `BadRequestException`: Client-side validation errors
- `UnauthorizedException`: Authentication failures
- `ForbiddenException`: Authorization violations
- `NotFoundException`: Resource not found
- `InternalServerError`: Server-side errors

**Customization Options:**
- Configurable error message formatting
- Support for development vs production modes
- Integration with logging systems
- Custom status code mapping

**Section sources**
- [http-exception.filter.ts](file://API/src/common/filters/http-exception.filter.ts)

## Interceptors (LoggingInterceptor, TransformInterceptor)

### LoggingInterceptor
The `LoggingInterceptor` provides comprehensive request/response logging for debugging and audit purposes. It captures detailed information about each API call including timing, headers, and response status.

**Logged Information:**
- Request method and URL
- Client IP address and User-Agent
- Request headers (sanitized)
- Response status code and duration
- Error details when exceptions occur

**Performance Monitoring:**
- Measures request processing time
- Tracks slow endpoints for optimization
- Supports structured logging formats
- Integrates with external logging services

### TransformInterceptor
The `TransformInterceptor` standardizes API responses by wrapping data in a consistent format. It ensures all responses follow the application's response schema regardless of the controller implementation.

**Response Transformation:**
- Wraps successful responses in `{ data, message, statusCode, timestamp }`
- Preserves original response structure for nested objects
- Adds standardized metadata fields
- Handles null and undefined values consistently

**Configuration Options:**
- Custom message templates
- Conditional transformation based on route
- Support for streaming responses
- Integration with validation pipes

**Section sources**
- [logging.interceptor.ts](file://API/src/common/interceptors/logging.interceptor.ts)
- [transform.interceptor.ts](file://API/src/common/interceptors/transform.interceptor.ts)

## DTOs Comuns (PaginationDto, ApiResponseDto)

### PaginationDto
The `PaginationDto` defines the standard structure for paginated API responses. It includes metadata for navigation and total record counts.

**Structure:**
```typescript
interface PaginationDto<T> {
  data: T[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
  };
}
```

**Features:**
- Generic type support for any data array
- Automatic calculation of pagination metadata
- Optional link generation for API navigation
- Type-safe query parameter validation

### ApiResponseDto
The `ApiResponseDto` provides a unified response structure for all API endpoints. It ensures consistency in how data is returned to clients.

**Success Response Structure:**
```typescript
interface SuccessResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  timestamp: string;
}
```

**Error Response Structure:**
```typescript
interface ErrorResponse {
  error: string;
  message: string | string[];
  statusCode: number;
  timestamp: string;
  path: string;
}
```

**Benefits:**
- Consistent client-side parsing
- Built-in error handling patterns
- Versioning support through structure evolution
- Documentation generation compatibility

**Section sources**
- [pagination.dto.ts](file://API/src/common/dto/pagination.dto.ts)
- [api-response.dto.ts](file://API/src/common/dto/api-response.dto.ts)

## Utilitários (formatDate, buildPaginationMeta)

### formatDate Utility
The `formatDate` utility function handles date formatting according to the application's locale settings (pt-PT). It ensures consistent date representation across the API.

**Formatting Options:**
- ISO 8601 format for API responses
- Localized date strings for display
- UTC timezone handling
- Fallback for invalid dates

**Usage Examples:**
```typescript
// API responses - ISO format
const apiDate = formatDate(new Date(), 'iso'); // "2024-01-01T00:00:00.000Z"

// Display format - localized
const displayDate = formatDate(new Date(), 'display'); // "1 de janeiro de 2024"
```

### buildPaginationMeta Utility
The `buildPaginationMeta` function generates pagination metadata based on query parameters and total item count. It calculates page numbers, limits, and navigation links automatically.

**Calculation Logic:**
- Validates input parameters (page, limit)
- Calculates total pages from total items and limit
- Generates next/previous page indicators
- Creates API-friendly link structures

**Input Parameters:**
- `totalItems`: Total number of records
- `currentPage`: Current page number (default: 1)
- `itemsPerPage`: Items per page (default: 10)
- `baseUrl`: Base URL for link generation

**Output Structure:**
```typescript
{
  currentPage: number,
  itemsPerPage: number,
  totalItems: number,
  totalPages: number,
  hasNextPage: boolean,
  hasPrevPage: boolean,
  nextPageUrl?: string,
  prevPageUrl?: string
}
```

**Section sources**
- [index.ts](file://API/src/common/utils/index.ts)

## Architecture Overview

The common infrastructure components work together to provide a robust foundation for the NestJS application:

```mermaid
graph TB
subgraph "Request Flow"
Client["Client Request"] --> Guard["Authentication Guard"]
Guard --> RoleCheck["Role-Based Guard"]
RoleCheck --> Controller["Controller Method"]
end
subgraph "Processing Pipeline"
Controller --> Interceptor["Transform Interceptor"]
Interceptor --> Service["Business Logic"]
Service --> Database["Database Layer"]
end
subgraph "Response Handling"
Database --> Service
Service --> Interceptor
Interceptor --> Filter["Exception Filter"]
Filter --> Client
end
subgraph "Decorators & Utilities"
Decorators["@CurrentUser", "@Roles"] --> Controller
Utils["formatDate, buildPaginationMeta"] --> Service
end
```

**Diagram sources**
- [current-user.decorator.ts](file://API/src/common/decorators/current-user.decorator.ts)
- [roles.decorator.ts](file://API/src/common/decorators/roles.decorator.ts)
- [roles.guard.ts](file://API/src/common/guards/roles.guard.ts)
- [logging.interceptor.ts](file://API/src/common/interceptors/logging.interceptor.ts)
- [transform.interceptor.ts](file://API/src/common/interceptors/transform.interceptor.ts)
- [http-exception.filter.ts](file://API/src/common/filters/http-exception.filter.ts)

## Best Practices

### Security Guidelines
- Always use `@CurrentUser()` instead of accessing `req.user` directly
- Apply `@Roles()` decorator to all protected endpoints
- Validate user input using DTOs with class-validator
- Never expose sensitive user data in API responses

### Performance Optimization
- Use pagination for large datasets
- Implement caching strategies for frequently accessed data
- Optimize database queries with proper indexing
- Monitor slow endpoints using LoggingInterceptor

### Code Organization
- Keep business logic in service layers
- Use DTOs for request/response validation
- Implement proper error handling with custom exceptions
- Follow TypeScript best practices for type safety

## Troubleshooting Guide

### Common Issues
1. **Authentication Errors**: Ensure JWT tokens are properly signed and not expired
2. **Authorization Failures**: Verify user roles match the required roles in `@Roles()` decorator
3. **Pagination Problems**: Check that query parameters are within acceptable ranges
4. **Date Formatting**: Confirm timezone settings and locale configurations

### Debugging Tips
- Enable detailed logging in development mode
- Use NestJS debug flags for component inspection
- Test endpoints with Postman or similar tools
- Monitor error logs for stack traces and context

**Section sources**
- [index.ts](file://API/src/common/index.ts)