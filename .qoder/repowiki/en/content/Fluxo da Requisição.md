# Request Flow

<cite>
**Referenced Files in This Document**
- [main.ts](file://API/src/main.ts)
- [app.module.ts](file://API/src/app.module.ts)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [jwt.strategy.ts](file://API/src/modules/auth/strategies/jwt.strategy.ts)
- [roles.guard.ts](file://API/src/common/guards/roles.guard.ts)
- [logging.interceptor.ts](file://API/src/common/interceptors/logging.interceptor.ts)
- [transform.interceptor.ts](file://API/src/common/interceptors/transform.interceptor.ts)
- [http-exception.filter.ts](file://API/src/common/filters/http-exception.filter.ts)
- [api.ts](file://src/services/api.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
</cite>

## Table of Contents
- Fluxo Backend (Request → Response)
- Fluxo Frontend (User Action → UI Update)
- Pipeline de Interceptors
- Middleware e Guards

## Fluxo Backend (Request → Response)
This section explains how a NestJS request travels from the HTTP server to the controller, through guards and interceptors, into the service layer, and back to the client with a standardized response.

Key steps:
- Application bootstrap registers global interceptors, filters, and authentication strategy.
- Incoming HTTP requests are routed by controllers based on path and HTTP method.
- Guards validate authorization (e.g., roles).
- Interceptors transform responses and log execution details.
- Services perform business logic and data access.
- A global exception filter normalizes error responses.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Nest as "NestJS App"
participant Controller as "Controller"
participant Guard as "RolesGuard"
participant Service as "Service"
participant DB as "Database"
participant Filter as "HttpExceptionFilter"
Client->>Nest : HTTP Request
Nest->>Controller : Route match
Controller->>Guard : Validate roles
alt Authorized
Guard-->>Controller : Allow
Controller->>Service : Business logic
Service->>DB : Data operations
DB-->>Service : Result
Service-->>Controller : Domain result
Controller-->>Nest : Response object
Nest->>Nest : Transform + Log
Nest-->>Client : Standardized JSON
else Unauthorized
Guard-->>Nest : Deny
Nest->>Filter : Throw HttpException
Filter-->>Client : Error envelope
end
```

**Section sources**
- [main.ts](file://API/src/main.ts)
- [app.module.ts](file://API/src/app.module.ts)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [roles.guard.ts](file://API/src/common/guards/roles.guard.ts)
- [logging.interceptor.ts](file://API/src/common/interceptors/logging.interceptor.ts)
- [transform.interceptor.ts](file://API/src/common/interceptors/transform.interceptor.ts)
- [http-exception.filter.ts](file://API/src/common/filters/http-exception.filter.ts)

## Fluxo Frontend (User Action → UI Update)
This section describes how a user interaction in the React frontend triggers an API call via TanStack Query, handles success/error states, and updates the UI.

Typical flow:
- User action triggers a mutation or query hook.
- The service layer builds the HTTP request using the configured API client.
- TanStack Query manages caching, retries, and invalidation.
- On success, components re-render with updated data; on error, they display messages.

```mermaid
sequenceDiagram
participant User as "User"
participant Component as "React Component"
participant Hook as "TanStack Query Hook"
participant Service as "Frontend Service"
participant API as "HTTP Client"
participant Backend as "NestJS API"
User->>Component : Click / Input
Component->>Hook : Trigger mutation/query
Hook->>Service : Call service method
Service->>API : Build request (headers, payload)
API->>Backend : HTTP request
Backend-->>API : JSON response
API-->>Service : Parsed data
Service-->>Hook : Resolve promise
Hook-->>Component : Update state / invalidate cache
Component-->>User : UI reflects new data
```

**Section sources**
- [api.ts](file://src/services/api.ts)
- [auth.service.ts](file://src/services/auth.service.ts)

## Pipeline de Interceptors
Interceptors wrap controller execution to add cross-cutting concerns such as logging and response transformation.

- LoggingInterceptor records request metadata and duration for auditability.
- TransformInterceptor standardizes response envelopes and maps errors consistently.

```mermaid
flowchart TD
Start(["Incoming Request"]) --> Logging["LoggingInterceptor<br/>Capture context & timing"]
Logging --> Handler["Controller Method"]
Handler --> Transform["TransformInterceptor<br/>Normalize response shape"]
Transform --> End(["Outgoing Response"])
```

**Section sources**
- [logging.interceptor.ts](file://API/src/common/interceptors/logging.interceptor.ts)
- [transform.interceptor.ts](file://API/src/common/interceptors/transform.interceptor.ts)

## Middleware e Guards
Guards enforce authorization policies before controller methods execute. In this project, RBAC is implemented via a roles guard that validates the role claim from the JWT payload.

- RolesGuard checks the authenticated user’s role against the required roles defined on the route/controller.
- Authentication is handled by a JWT strategy that extracts and validates tokens from the Authorization header.

```mermaid
classDiagram
class RolesGuard {
+canActivate(context) bool
-checkRole(user, allowedRoles) bool
}
class JwtStrategy {
+validate(payload) User
-verifyToken(token) TokenPayload
}
class AuthController {
+login(dto) LoginResponse
+register(dto) RegisterResponse
+updateProfile(dto) ProfileResponse
}
RolesGuard <.. AuthController : "applied at routes"
JwtStrategy <.. AuthController : "used by @UseGuards(JwtAuthGuard)"
```

**Section sources**
- [roles.guard.ts](file://API/src/common/guards/roles.guard.ts)
- [jwt.strategy.ts](file://API/src/modules/auth/strategies/jwt.strategy.ts)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)