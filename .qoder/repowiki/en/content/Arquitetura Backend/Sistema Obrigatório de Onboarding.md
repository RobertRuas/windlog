# Mandatory Onboarding System

<cite>
**Referenced Files in This Document**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [HomePage.tsx](file://src/pages/home/HomePage.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [ProfileCompleteness.tsx](file://src/pages/home/components/ProfileCompleteness.tsx)
- [onboarding.json](file://src/i18n/locales/pt/onboarding.json)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)
- [change-temp-password.dto.ts](file://API/src/modules/auth/dto/change-temp-password.dto.ts)
- [schema.prisma](file://API/prisma/schema.prisma)
- [20260804092113_add_onboarding_fields/migration.sql](file://API/prisma/migrations/20260804092113_add_onboarding_fields/migration.sql)
- [auth.module.ts](file://API/src/modules/auth/auth.module.ts)
- [app.module.ts](file://API/src/app.module.ts)
- [main.ts](file://API/src/main.ts)
- [api.ts](file://src/services/api.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [jwt.ts](file://src/utils/jwt.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document describes the Mandatory Onboarding System implemented across the NestJS backend and React frontend. The system enforces a guided onboarding flow for new users, ensuring profile completeness before granting full access to application features. It includes:
- Backend DTOs and endpoints for onboarding data submission and temporary password changes
- Database schema fields supporting onboarding state tracking
- Frontend pages and components that guide users through required steps
- Internationalization (i18n) support for user-facing text
- Integration with authentication via JWT Bearer tokens

The design follows the project-wide guidelines: English codebase, PT-BR comments/documentation, UUID-based IDs, soft delete timestamps, standardized API responses, Euro currency formatting, Apple-inspired minimal UI, TanStack Query for data fetching, and comprehensive logging.

## Project Structure
The onboarding feature spans both frontend and backend:
- Frontend: Onboarding page and home page wizard components, i18n resources, and services for API calls
- Backend: Auth module controllers, services, DTOs, Prisma schema, and migrations

```mermaid
graph TB
subgraph "Frontend"
OP["OnboardingPage.tsx"]
HP["HomePage.tsx"]
PW["ProfileWizard.tsx"]
PC["ProfileCompleteness.tsx"]
I18N["onboarding.json"]
SAPI["services/api.ts"]
SAUTH["services/auth.service.ts"]
end
subgraph "Backend"
AC["auth.controller.ts"]
AS["auth.service.ts"]
ADTO["onboarding.dto.ts"]
CTPDTO["change-temp-password.dto.ts"]
SCHEMA["schema.prisma"]
MIG["add_onboarding_fields migration.sql"]
AMOD["auth.module.ts"]
APPMOD["app.module.ts"]
MAIN["main.ts"]
end
OP --> PW
HP --> PW
PW --> PC
PW --> SAPI
SAPI --> AC
AC --> AS
AS --> ADTO
AS --> SCHEMA
SCHEMA --> MIG
AMOD --> AC
APPMOD --> AMOD
MAIN --> APPMOD
SAUTH --> SAPI
```

**Diagram sources**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [HomePage.tsx](file://src/pages/home/HomePage.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [ProfileCompleteness.tsx](file://src/pages/home/components/ProfileCompleteness.tsx)
- [onboarding.json](file://src/i18n/locales/pt/onboarding.json)
- [api.ts](file://src/services/api.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)
- [change-temp-password.dto.ts](file://API/src/modules/auth/dto/change-temp-password.dto.ts)
- [schema.prisma](file://API/prisma/schema.prisma)
- [20260804092113_add_onboarding_fields/migration.sql](file://API/prisma/migrations/20260804092113_add_onboarding_fields/migration.sql)
- [auth.module.ts](file://API/src/modules/auth/auth.module.ts)
- [app.module.ts](file://API/src/app.module.ts)
- [main.ts](file://API/src/main.ts)

**Section sources**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [HomePage.tsx](file://src/pages/home/HomePage.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [ProfileCompleteness.tsx](file://src/pages/home/components/ProfileCompleteness.tsx)
- [onboarding.json](file://src/i18n/locales/pt/onboarding.json)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)
- [change-temp-password.dto.ts](file://API/src/modules/auth/dto/change-temp-password.dto.ts)
- [schema.prisma](file://API/prisma/schema.prisma)
- [20260804092113_add_onboarding_fields/migration.sql](file://API/prisma/migrations/20260804092113_add_onboarding_fields/migration.sql)
- [auth.module.ts](file://API/src/modules/auth/auth.module.ts)
- [app.module.ts](file://API/src/app.module.ts)
- [main.ts](file://API/src/main.ts)

## Core Components
- Onboarding Page: Entry point for mandatory onboarding flow; guides users through required profile sections
- Profile Wizard: Orchestrates step-by-step completion of profile fields and validations
- Profile Completeness: Calculates and displays progress toward full profile completion
- Backend Auth Controller: Exposes REST endpoints for onboarding submissions and temporary password changes
- Backend Auth Service: Implements business logic for onboarding data processing and validation
- DTOs: Define request payloads for onboarding and temporary password updates
- Prisma Schema and Migration: Add onboarding-related fields to persist user state
- Services and Utilities: Handle API communication, JWT token management, and query invalidation

Key responsibilities:
- Enforce mandatory fields before allowing access to protected routes
- Validate inputs using DTOs and return standardized error responses
- Track onboarding progress and update database records accordingly
- Provide localized messages for user guidance

**Section sources**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [ProfileCompleteness.tsx](file://src/pages/home/components/ProfileCompleteness.tsx)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)
- [change-temp-password.dto.ts](file://API/src/modules/auth/dto/change-temp-password.dto.ts)
- [schema.prisma](file://API/prisma/schema.prisma)
- [20260804092113_add_onboarding_fields/migration.sql](file://API/prisma/migrations/20260804092113_add_onboarding_fields/migration.sql)

## Architecture Overview
The onboarding flow integrates frontend components with backend endpoints, leveraging JWT authentication and standardized API responses.

```mermaid
sequenceDiagram
participant User as "User"
participant FE as "OnboardingPage.tsx / ProfileWizard.tsx"
participant API as "services/api.ts"
participant CTRL as "auth.controller.ts"
participant SVC as "auth.service.ts"
participant DB as "Prisma (schema.prisma)"
User->>FE : Open onboarding flow
FE->>API : Submit onboarding data (POST /auth/onboarding)
API->>CTRL : Route request to controller
CTRL->>SVC : Validate DTO and process onboarding
SVC->>DB : Update user onboarding fields
DB-->>SVC : Success or error
SVC-->>CTRL : Standardized response
CTRL-->>API : { data, message, statusCode, timestamp }
API-->>FE : Response handling and cache invalidation
FE-->>User : Show success and next steps
```

**Diagram sources**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [api.ts](file://src/services/api.ts)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [schema.prisma](file://API/prisma/schema.prisma)

## Detailed Component Analysis

### Frontend Onboarding Flow
- OnboardingPage serves as the entry point, rendering the wizard and progress indicators
- ProfileWizard manages step navigation, field validation, and submission orchestration
- ProfileCompleteness computes completion percentage based on required fields
- i18n resource provides localized strings for labels, hints, and messages
- Services handle API calls and invalidate queries upon successful mutations

```mermaid
flowchart TD
Start(["Open Onboarding"]) --> CheckAuth["Check JWT and role"]
CheckAuth --> |Valid| LoadWizard["Load ProfileWizard"]
CheckAuth --> |Invalid| Redirect["Redirect to login"]
LoadWizard --> Step1["Step 1: Basic Info"]
Step1 --> Validate1{"Valid?"}
Validate1 --> |No| Error1["Show validation errors"]
Validate1 --> |Yes| Step2["Step 2: Documents"]
Step2 --> Validate2{"Valid?"}
Validate2 --> |No| Error2["Show validation errors"]
Validate2 --> |Yes| Step3["Step 3: Preferences"]
Step3 --> Validate3{"Valid?"}
Validate3 --> |No| Error3["Show validation errors"]
Validate3 --> |Yes| Submit["Submit to API"]
Submit --> Success{"Success?"}
Success --> |No| HandleError["Handle error response"]
Success --> |Yes| Invalidate["Invalidate related queries"]
Invalidate --> Complete["Mark onboarding complete"]
Complete --> End(["Done"])
```

**Diagram sources**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [ProfileCompleteness.tsx](file://src/pages/home/components/ProfileCompleteness.tsx)
- [onboarding.json](file://src/i18n/locales/pt/onboarding.json)
- [api.ts](file://src/services/api.ts)

**Section sources**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [ProfileCompleteness.tsx](file://src/pages/home/components/ProfileCompleteness.tsx)
- [onboarding.json](file://src/i18n/locales/pt/onboarding.json)
- [api.ts](file://src/services/api.ts)

### Backend Onboarding Endpoints
- Auth Controller exposes endpoints for onboarding data submission and temporary password changes
- DTOs enforce input validation rules for onboarding payloads
- Auth Service processes requests, validates data, and interacts with Prisma
- Prisma Schema includes onboarding-related fields for user entities
- Migration adds necessary columns to support onboarding state tracking

```mermaid
classDiagram
class AuthController {
+submitOnboarding(dto)
+changeTempPassword(dto)
}
class AuthService {
+processOnboarding(data)
+updateTempPassword(userId, newPassword)
-validateInput(data)
-persistToDatabase(data)
}
class OnboardingDTO {
+fields : object
+validationRules : object
}
class ChangeTempPasswordDTO {
+currentPassword : string
+newPassword : string
}
class PrismaSchema {
+User.onboardingFields
+timestamps : createdAt, updatedAt, deletedAt
}
AuthController --> AuthService : "delegates"
AuthService --> OnboardingDTO : "validates"
AuthService --> ChangeTempPasswordDTO : "validates"
AuthService --> PrismaSchema : "persists"
```

**Diagram sources**
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)
- [change-temp-password.dto.ts](file://API/src/modules/auth/dto/change-temp-password.dto.ts)
- [schema.prisma](file://API/prisma/schema.prisma)

**Section sources**
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)
- [change-temp-password.dto.ts](file://API/src/modules/auth/dto/change-temp-password.dto.ts)
- [schema.prisma](file://API/prisma/schema.prisma)
- [20260804092113_add_onboarding_fields/migration.sql](file://API/prisma/migrations/20260804092113_add_onboarding_fields/migration.sql)

### Authentication and Authorization Integration
- JWT Bearer tokens are used for authentication, containing user ID, email, and role
- Roles (ADMIN, HR, STANDARD) control access to onboarding endpoints
- Standardized API responses ensure consistent error handling and status codes
- Logging captures all onboarding actions with context for audit trails

```mermaid
sequenceDiagram
participant Client as "Frontend"
participant Guard as "RolesGuard"
participant Ctrl as "AuthController"
participant Svc as "AuthService"
participant Log as "SystemLogService"
Client->>Ctrl : POST /auth/onboarding (Bearer Token)
Ctrl->>Guard : Validate role and permissions
Guard-->>Ctrl : Access granted/denied
Ctrl->>Svc : Process onboarding payload
Svc->>Log : Log action with context
Svc-->>Ctrl : Standardized response
Ctrl-->>Client : { data, message, statusCode, timestamp }
```

**Diagram sources**
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [jwt.ts](file://src/utils/jwt.ts)

**Section sources**
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [jwt.ts](file://src/utils/jwt.ts)

## Dependency Analysis
The onboarding system has clear dependencies between frontend components, backend modules, and database schema:

```mermaid
graph TB
FE_PW["ProfileWizard.tsx"] --> FE_API["services/api.ts"]
FE_HP["HomePage.tsx"] --> FE_PW
FE_OP["OnboardingPage.tsx"] --> FE_PW
FE_SAUTH["services/auth.service.ts"] --> FE_API
FE_API --> BE_CTRL["auth.controller.ts"]
BE_CTRL --> BE_SVC["auth.service.ts"]
BE_SVC --> BE_DTO["onboarding.dto.ts"]
BE_SVC --> BE_PRISMA["schema.prisma"]
BE_PRISMA --> BE_MIG["add_onboarding_fields migration.sql"]
BE_MOD["auth.module.ts"] --> BE_CTRL
APP_MOD["app.module.ts"] --> BE_MOD
MAIN["main.ts"] --> APP_MOD
```

**Diagram sources**
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [HomePage.tsx](file://src/pages/home/HomePage.tsx)
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [api.ts](file://src/services/api.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)
- [schema.prisma](file://API/prisma/schema.prisma)
- [20260804092113_add_onboarding_fields/migration.sql](file://API/prisma/migrations/20260804092113_add_onboarding_fields/migration.sql)
- [auth.module.ts](file://API/src/modules/auth/auth.module.ts)
- [app.module.ts](file://API/src/app.module.ts)
- [main.ts](file://API/src/main.ts)

**Section sources**
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [HomePage.tsx](file://src/pages/home/HomePage.tsx)
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [api.ts](file://src/services/api.ts)
- [auth.service.ts](file://src/services/auth.service.ts)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)
- [schema.prisma](file://API/prisma/schema.prisma)
- [20260804092113_add_onboarding_fields/migration.sql](file://API/prisma/migrations/20260804092113_add_onboarding_fields/migration.sql)
- [auth.module.ts](file://API/src/modules/auth/auth.module.ts)
- [app.module.ts](file://API/src/app.module.ts)
- [main.ts](file://API/src/main.ts)

## Performance Considerations
- Use TanStack Query caching to minimize redundant API calls during onboarding steps
- Implement optimistic updates for better perceived performance when submitting onboarding data
- Validate inputs client-side first to reduce server load and provide immediate feedback
- Avoid heavy computations in the main thread; use Web Workers if complex calculations are needed
- Optimize image uploads by compressing files before sending to the server
- Monitor database query performance for onboarding data persistence operations

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and solutions:
- Validation errors: Ensure DTOs match frontend form structure and validation rules
- Authentication failures: Verify JWT token is properly attached to requests and contains valid role claims
- Database migration issues: Confirm all migrations are applied and schema matches expected state
- i18n missing keys: Check that all required translation keys exist in onboarding.json
- Cache inconsistencies: Invalidate relevant queries after successful mutations to prevent stale data

**Section sources**
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)
- [change-temp-password.dto.ts](file://API/src/modules/auth/dto/change-temp-password.dto.ts)
- [onboarding.json](file://src/i18n/locales/pt/onboarding.json)
- [api.ts](file://src/services/api.ts)

## Conclusion
The Mandatory Onboarding System provides a robust framework for guiding new users through essential profile setup. By combining frontend wizard components with backend validation and database persistence, it ensures data completeness while maintaining security through role-based access control. The modular architecture allows for easy extension and maintenance, following established patterns for authentication, authorization, and internationalization.

[No sources needed since this section summarizes without analyzing specific files]