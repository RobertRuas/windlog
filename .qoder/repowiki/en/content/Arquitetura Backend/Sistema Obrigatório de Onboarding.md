# Mandatory Onboarding System

<cite>
**Referenced Files in This Document**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [useOnboardingForm.ts](file://src/pages/onboarding/hooks/useOnboardingForm.ts)
- [SectionCard.tsx](file://src/components/ui/SectionCard.tsx)
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

## Update Summary
**Changes Made**
- Refactored OnboardingPage.tsx from 639 to 377 lines by extracting form handling logic into useOnboardingForm.ts custom hook
- Created reusable SectionCard.tsx component for consistent UI patterns
- Implemented hook-based architecture for improved code organization and reusability
- Enhanced separation of concerns between presentation and business logic
- Improved maintainability through modular component design

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Enhanced Features](#enhanced-features)
7. [Dependency Analysis](#dependency-analysis)
8. [Performance Considerations](#performance-considerations)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction
This document describes the Enhanced Mandatory Onboarding System implemented across the NestJS backend and React frontend. The system provides a comprehensive guided onboarding flow for new users with automatic profile data pre-population, ensuring complete profile setup before granting full access to application features. The enhanced system includes:
- Automatic profile data loading and pre-population
- Comprehensive address and contact field management
- Advanced validation rules including age verification (18+)
- Passport document validation with date validation
- Cancel functionality for improved user experience
- Internationalization support with country code phone input
- Enhanced UI/UX with better form handling and error management

The design follows the project-wide guidelines: English codebase, PT-BR comments/documentation, UUID-based IDs, soft delete timestamps, standardized API responses, Euro currency formatting, Apple-inspired minimal UI, TanStack Query for data fetching, and comprehensive logging.

**Updated** The system has been refactored to use a hook-based architecture with extracted form handling logic and reusable components for improved maintainability and code organization.

## Project Structure
The enhanced onboarding feature spans both frontend and backend with significant improvements and recent architectural changes:
- Frontend: Enhanced onboarding page with automatic data loading, improved wizard components, comprehensive validation, and i18n resources
- Backend: Enhanced auth module with advanced DTOs, comprehensive validation, and improved database schema support
- **New**: Hook-based architecture with useOnboardingForm.ts custom hook for form state management
- **New**: Reusable SectionCard.tsx component for consistent UI patterns

```mermaid
graph TB
subgraph "Enhanced Frontend"
OP["OnboardingPage.tsx<br/>Refactored (377 lines)"]
UOF["useOnboardingForm.ts<br/>Custom Hook"]
SC["SectionCard.tsx<br/>Reusable Component"]
HP["HomePage.tsx"]
PW["ProfileWizard.tsx<br/>Advanced validation"]
PC["ProfileCompleteness.tsx"]
I18N["onboarding.json<br/>Multi-language support"]
SAPI["services/api.ts"]
SAUTH["services/auth.service.ts"]
PF["ProfileForm<br/>Address/Contact fields"]
PV["ValidationEngine<br/>Age 18+, Passport dates"]
CF["CancelFunctionality"]
end
subgraph "Enhanced Backend"
AC["auth.controller.ts"]
AS["auth.service.ts"]
ADTO["onboarding.dto.ts<br/>Advanced validation"]
CTPDTO["change-temp-password.dto.ts"]
SCHEMA["schema.prisma<br/>Extended fields"]
MIG["add_onboarding_fields migration.sql"]
AMOD["auth.module.ts"]
APPMOD["app.module.ts"]
MAIN["main.ts"]
end
OP --> UOF
OP --> SC
OP --> PW
HP --> PW
PW --> PC
PW --> PF
PW --> PV
PW --> CF
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
- [useOnboardingForm.ts](file://src/pages/onboarding/hooks/useOnboardingForm.ts)
- [SectionCard.tsx](file://src/components/ui/SectionCard.tsx)
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
- [useOnboardingForm.ts](file://src/pages/onboarding/hooks/useOnboardingForm.ts)
- [SectionCard.tsx](file://src/components/ui/SectionCard.tsx)
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
- **Refactored Onboarding Page**: Streamlined entry point with automatic profile data loading and pre-population capabilities using hook-based architecture
- **useOnboardingForm Custom Hook**: Centralized form state management, validation logic, and API integration
- **SectionCard Reusable Component**: Consistent UI pattern for form sections with standardized styling and behavior
- **Advanced Profile Wizard**: Orchestrates step-by-step completion with comprehensive validation rules
- **Profile Completeness Calculator**: Enhanced progress tracking with detailed field-level validation
- **Internationalized Form System**: Multi-language support with country-specific formatting
- **Advanced Validation Engine**: Real-time validation including age verification (18+), passport date validation
- **Comprehensive Address/Contact Management**: Full address and contact information handling
- **Cancel Functionality**: User-friendly cancellation with data preservation options
- **Backend Auth Controller**: Enhanced endpoints supporting advanced validation and data processing
- **Enhanced DTOs**: Comprehensive request payload validation with business rules
- **Extended Prisma Schema**: Database fields supporting all new onboarding requirements

Key responsibilities:
- Automatic profile data pre-population from existing user information
- Advanced validation with real-time feedback and error handling
- Internationalization support with localized validation messages
- Comprehensive address and contact field management
- Age verification and passport document validation
- Seamless cancellation with data preservation
- Enhanced user experience with progressive disclosure
- **New**: Modular form state management through custom hooks
- **New**: Reusable UI components for consistent user experience

**Updated** The core components now leverage a hook-based architecture that separates form logic from presentation, improving code maintainability and testability.

**Section sources**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [useOnboardingForm.ts](file://src/pages/onboarding/hooks/useOnboardingForm.ts)
- [SectionCard.tsx](file://src/components/ui/SectionCard.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [ProfileCompleteness.tsx](file://src/pages/home/components/ProfileCompleteness.tsx)
- [onboarding.json](file://src/i18n/locales/pt/onboarding.json)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)
- [change-temp-password.dto.ts](file://API/src/modules/auth/dto/change-temp-password.dto.ts)
- [schema.prisma](file://API/prisma/schema.prisma)
- [20260804092113_add_onboarding_fields/migration.sql](file://API/prisma/migrations/20260804092113_add_onboarding_fields/migration.sql)

## Architecture Overview
The enhanced onboarding flow integrates advanced frontend components with sophisticated backend validation, leveraging JWT authentication and comprehensive data processing. The architecture now follows React best practices with custom hooks for state management and reusable components for UI consistency.

```mermaid
sequenceDiagram
participant User as "User"
participant FE as "OnboardingPage.tsx<br/>(Hook-based)"
participant Hook as "useOnboardingForm.ts"
participant AE as "Auto-Loader"
participant PW as "ProfileWizard.tsx"
participant SC as "SectionCard.tsx"
participant VE as "ValidationEngine"
participant API as "services/api.ts"
participant CTRL as "auth.controller.ts"
participant SVC as "auth.service.ts"
participant DB as "Prisma (schema.prisma)"
User->>FE : Open onboarding flow
FE->>Hook : Initialize form state
Hook->>AE : Load existing profile data
AE-->>Hook : Pre-populate form fields
Hook-->>FE : Provide form methods
FE->>PW : Initialize wizard with data
PW->>SC : Render sections with reusable component
SC->>VE : Validate inputs in real-time
VE-->>SC : Validation results
SC-->>PW : Validated section data
PW->>Hook : Submit validated data
Hook->>API : POST /auth/onboarding
API->>CTRL : Route request to controller
CTRL->>SVC : Process with advanced validation
SVC->>DB : Update extended user fields
DB-->>SVC : Success or error
SVC-->>CTRL : Standardized response
CTRL-->>API : { data, message, statusCode, timestamp }
API-->>Hook : Response handling and cache invalidation
Hook-->>FE : Update form state
FE-->>User : Show success and next steps
```

**Diagram sources**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [useOnboardingForm.ts](file://src/pages/onboarding/hooks/useOnboardingForm.ts)
- [SectionCard.tsx](file://src/components/ui/SectionCard.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [api.ts](file://src/services/api.ts)
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [schema.prisma](file://API/prisma/schema.prisma)

## Detailed Component Analysis

### Hook-Based Frontend Architecture
The refactored frontend now uses a modern React architecture with custom hooks for form state management and reusable components for consistent UI patterns.

- **useOnboardingForm Custom Hook**: Centralizes all form-related logic including state management, validation, API calls, and error handling
- **Refactored OnboardingPage**: Simplified presentation layer that consumes the custom hook and renders UI components
- **SectionCard Reusable Component**: Provides consistent styling and behavior for all form sections
- **Enhanced ProfileWizard**: Manages complex step navigation with comprehensive validation rules and real-time feedback
- **Enhanced ProfileCompleteness**: Provides detailed progress tracking with field-level validation status
- **Internationalized Forms**: Multi-language support with country-specific formatting for addresses and phone numbers
- **Advanced Validation Engine**: Real-time validation including age verification (18+), passport date validation, and format checking
- **Comprehensive Address/Contact Management**: Full address and contact information handling with validation
- **Cancel Functionality**: User-friendly cancellation with data preservation and confirmation dialogs
- **Improved UI/UX**: Progressive disclosure, inline validation, and contextual help

```mermaid
flowchart TD
Start(["Open Enhanced Onboarding"]) --> CheckAuth["Check JWT and role"]
CheckAuth --> |Valid| InitHook["Initialize useOnboardingForm hook"]
CheckAuth --> |Invalid| Redirect["Redirect to login"]
InitHook --> AutoLoad["Auto-load existing profile data"]
AutoLoad --> LoadWizard["Initialize ProfileWizard with pre-populated data"]
LoadWizard --> Step1["Step 1: Basic Info + Auto-fill"]
Step1 --> Validate1{"Real-time validation<br/>Age ≥ 18, Required fields"}
Validate1 --> |No| Error1["Show validation errors with hints"]
Validate1 --> |Yes| Step2["Step 2: Address & Contact<br/>Country-specific formatting"]
Step2 --> Validate2{"Format validation<br/>Phone, Email, Address"}
Validate2 --> |No| Error2["Show format validation errors"]
Validate2 --> |Yes| Step3["Step 3: Documents<br/>Passport validation"]
Step3 --> Validate3{"Document validation<br/>Date checks, Format validation"}
Validate3 --> |No| Error3["Show document validation errors"]
Validate3 --> |Yes| Step4["Step 4: Preferences<br/>Language & Country"]
Step4 --> Validate4{"Preference validation"}
Validate4 --> |No| Error4["Show preference validation errors"]
Validate4 --> |Yes| Submit["Submit via useOnboardingForm hook"]
Submit --> Success{"Success?"}
Success --> |No| HandleError["Handle error with detailed messages"]
Success --> |Yes| Invalidate["Invalidate related queries"]
Invalidate --> Complete["Mark onboarding complete"]
Complete --> End(["Done"])
```

**Diagram sources**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [useOnboardingForm.ts](file://src/pages/onboarding/hooks/useOnboardingForm.ts)
- [SectionCard.tsx](file://src/components/ui/SectionCard.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [ProfileCompleteness.tsx](file://src/pages/home/components/ProfileCompleteness.tsx)
- [onboarding.json](file://src/i18n/locales/pt/onboarding.json)
- [api.ts](file://src/services/api.ts)

**Updated** The frontend architecture now follows React best practices with custom hooks for state management and reusable components for consistent UI patterns, significantly reducing code complexity and improving maintainability.

**Section sources**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [useOnboardingForm.ts](file://src/pages/onboarding/hooks/useOnboardingForm.ts)
- [SectionCard.tsx](file://src/components/ui/SectionCard.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [ProfileCompleteness.tsx](file://src/pages/home/components/ProfileCompleteness.tsx)
- [onboarding.json](file://src/i18n/locales/pt/onboarding.json)
- [api.ts](file://src/services/api.ts)

### Enhanced Backend Onboarding Endpoints
- **Advanced Auth Controller**: Exposes enhanced endpoints supporting automatic data loading and comprehensive validation
- **Enhanced DTOs**: Comprehensive input validation with business rules including age verification and document validation
- **Sophisticated Auth Service**: Advanced request processing with multi-layer validation and data enrichment
- **Extended Prisma Schema**: Database schema supporting all new onboarding fields including address, contact, and document data
- **Enhanced Migration**: Database migration adding necessary columns for comprehensive onboarding state tracking

```mermaid
classDiagram
class EnhancedAuthController {
+submitOnboarding(dto)
+loadProfileData(userId)
+changeTempPassword(dto)
+cancelOnboarding(userId)
}
class EnhancedAuthService {
+processOnboarding(data)
+autoLoadProfileData(userId)
+updateTempPassword(userId, newPassword)
+validateAdvancedInput(data)
+validateAgeRequirement(data)
+validatePassportDates(data)
+persistToDatabase(data)
}
class EnhancedOnboardingDTO {
+basicInfo : object
+address : object
+contact : object
+documents : object
+preferences : object
+advancedValidationRules : object
}
class ChangeTempPasswordDTO {
+currentPassword : string
+newPassword : string
}
class ExtendedPrismaSchema {
+User.onboardingFields
+User.addressFields
+User.contactFields
+User.documentFields
+timestamps : createdAt, updatedAt, deletedAt
}
EnhancedAuthController --> EnhancedAuthService : "delegates"
EnhancedAuthService --> EnhancedOnboardingDTO : "validates"
EnhancedAuthService --> ChangeTempPasswordDTO : "validates"
EnhancedAuthService --> ExtendedPrismaSchema : "persists"
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

### Enhanced Authentication and Authorization Integration
- **JWT Bearer tokens**: Enhanced authentication with additional claims for onboarding status
- **Role-based access control**: Roles (ADMIN, HR, STANDARD) control access to enhanced onboarding endpoints
- **Standardized API responses**: Consistent error handling with detailed validation messages
- **Comprehensive logging**: Enhanced audit trails capturing all onboarding actions with context
- **Session management**: Enhanced session handling for automatic data persistence during onboarding

```mermaid
sequenceDiagram
participant Client as "Enhanced Frontend"
participant Guard as "RolesGuard"
participant Ctrl as "EnhancedAuthController"
participant Svc as "EnhancedAuthService"
participant Log as "SystemLogService"
participant Cache as "Session Cache"
Client->>Ctrl : POST /auth/onboarding (Bearer Token + Auto-data)
Ctrl->>Guard : Validate role and permissions
Guard-->>Ctrl : Access granted/denied
Ctrl->>Svc : Process with auto-loading and validation
Svc->>Cache : Load existing profile data
Cache-->>Svc : Pre-populated data
Svc->>Log : Log action with enhanced context
Svc-->>Ctrl : Standardized response with validation details
Ctrl-->>Client : { data, message, statusCode, timestamp, validationErrors }
```

**Diagram sources**
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [jwt.ts](file://src/utils/jwt.ts)

**Section sources**
- [auth.controller.ts](file://API/src/modules/auth/auth.controller.ts)
- [auth.service.ts](file://API/src/modules/auth/auth.service.ts)
- [jwt.ts](file://src/utils/jwt.ts)

## Enhanced Features

### Automatic Profile Data Loading
The enhanced system automatically loads existing profile data when users start the onboarding process, providing a seamless experience by pre-populating available information and reducing manual data entry.

### Comprehensive Address and Contact Fields
Support for complete address information including street, city, state, postal code, and country, along with multiple contact methods including phone numbers with country code support and email addresses.

### Advanced Validation Rules
- **Age Verification**: Enforces minimum age requirement of 18 years with birth date validation
- **Passport Validation**: Validates passport document information including issue and expiry dates
- **Format Validation**: Country-specific phone number formatting and address validation
- **Real-time Validation**: Immediate feedback on form inputs with contextual error messages

### Internationalization Support
Full multi-language support with localized validation messages, country-specific formatting, and culturally appropriate form layouts.

### Enhanced User Experience
- **Cancel Functionality**: Users can cancel the onboarding process with data preservation options
- **Progressive Disclosure**: Contextual help and progressive form complexity
- **Inline Validation**: Real-time validation with visual feedback
- **Responsive Design**: Mobile-friendly interface with touch-optimized controls

### **New**: Hook-Based Architecture Benefits
- **Separation of Concerns**: Form logic is completely separated from presentation logic
- **Reusability**: Custom hook can be reused across different components
- **Testability**: Easier to unit test form logic independently
- **Maintainability**: Reduced code duplication and improved code organization
- **Performance**: Optimized state updates and reduced re-renders

**Updated** The addition of the hook-based architecture provides significant benefits in terms of code organization, testability, and maintainability while maintaining all existing functionality.

**Section sources**
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [useOnboardingForm.ts](file://src/pages/onboarding/hooks/useOnboardingForm.ts)
- [SectionCard.tsx](file://src/components/ui/SectionCard.tsx)
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [onboarding.json](file://src/i18n/locales/pt/onboarding.json)
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)

## Dependency Analysis
The enhanced onboarding system has sophisticated dependencies between frontend components, backend modules, and database schema with improved data flow and validation. The new hook-based architecture introduces additional layers of abstraction that improve modularity and testability.

```mermaid
graph TB
FE_PW["ProfileWizard.tsx<br/>Advanced validation"] --> FE_API["services/api.ts"]
FE_HP["HomePage.tsx"] --> FE_PW
FE_OP["OnboardingPage.tsx<br/>Hook-based"] --> FE_UOF["useOnboardingForm.ts<br/>Custom Hook"]
FE_UOF --> FE_API
FE_SAUTH["services/auth.service.ts"] --> FE_API
FE_AE["Auto-Loader"] --> FE_UOF
FE_VE["ValidationEngine"] --> FE_UOF
FE_PF["ProfileForm"] --> FE_UOF
FE_CF["CancelFunctionality"] --> FE_UOF
FE_SC["SectionCard.tsx<br/>Reusable Component"] --> FE_OP
FE_API --> BE_CTRL["auth.controller.ts"]
BE_CTRL --> BE_SVC["auth.service.ts"]
BE_SVC --> BE_DTO["onboarding.dto.ts<br/>Advanced validation"]
BE_SVC --> BE_PRISMA["schema.prisma<br/>Extended fields"]
BE_PRISMA --> BE_MIG["add_onboarding_fields migration.sql"]
BE_MOD["auth.module.ts"] --> BE_CTRL
APP_MOD["app.module.ts"] --> BE_MOD
MAIN["main.ts"] --> APP_MOD
```

**Diagram sources**
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [HomePage.tsx](file://src/pages/home/HomePage.tsx)
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [useOnboardingForm.ts](file://src/pages/onboarding/hooks/useOnboardingForm.ts)
- [SectionCard.tsx](file://src/components/ui/SectionCard.tsx)
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

**Updated** The dependency graph now shows the new hook-based architecture with useOnboardingForm.ts as a central orchestrator for form state management and SectionCard.tsx as a reusable UI component.

**Section sources**
- [ProfileWizard.tsx](file://src/pages/home/components/ProfileWizard.tsx)
- [HomePage.tsx](file://src/pages/home/HomePage.tsx)
- [OnboardingPage.tsx](file://src/pages/onboarding/OnboardingPage.tsx)
- [useOnboardingForm.ts](file://src/pages/onboarding/hooks/useOnboardingForm.ts)
- [SectionCard.tsx](file://src/components/ui/SectionCard.tsx)
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
- **Optimized Auto-loading**: Efficient profile data loading with caching strategies to minimize redundant API calls
- **Lazy Validation**: Client-side validation optimized for performance with debounced real-time checks
- **Incremental Submission**: Progressive data submission to reduce payload size and improve responsiveness
- **Caching Strategies**: Intelligent caching of validation rules and internationalization resources
- **Memory Management**: Proper cleanup of form data and validation states to prevent memory leaks
- **Database Optimization**: Indexed queries for profile data retrieval and efficient batch operations
- **Hook Optimization**: Custom hooks provide optimized state updates and prevent unnecessary re-renders
- **Component Reusability**: SectionCard component reduces DOM manipulation and improves rendering performance

**Updated** The hook-based architecture provides additional performance benefits through optimized state management and reduced component re-renders.

## Troubleshooting Guide
Common issues and solutions for the enhanced system:
- **Auto-loading failures**: Verify user authentication status and profile data availability
- **Validation errors**: Ensure DTOs match enhanced frontend form structure and advanced validation rules
- **Internationalization issues**: Check that all required translation keys exist in onboarding.json with proper country codes
- **Age validation problems**: Verify birth date format and timezone handling for age calculations
- **Passport validation errors**: Confirm date formats and validate passport document structure
- **Cancel functionality issues**: Ensure proper data preservation and session state management
- **Address/Contact field errors**: Validate country-specific formatting rules and required field combinations
- **Cache inconsistencies**: Invalidate relevant queries after successful mutations to prevent stale data
- **Hook state issues**: Verify proper initialization of useOnboardingForm hook and state synchronization
- **Component rendering problems**: Check SectionCard component props and ensure proper data passing

**Updated** Added troubleshooting guidance for the new hook-based architecture and reusable components.

**Section sources**
- [onboarding.dto.ts](file://API/src/modules/auth/dto/onboarding.dto.ts)
- [change-temp-password.dto.ts](file://API/src/modules/auth/dto/change-temp-password.dto.ts)
- [onboarding.json](file://src/i18n/locales/pt/onboarding.json)
- [api.ts](file://src/services/api.ts)
- [useOnboardingForm.ts](file://src/pages/onboarding/hooks/useOnboardingForm.ts)
- [SectionCard.tsx](file://src/components/ui/SectionCard.tsx)

## Conclusion
The Enhanced Mandatory Onboarding System provides a comprehensive framework for guiding new users through essential profile setup with automatic data pre-population, advanced validation, and internationalization support. By combining sophisticated frontend wizard components with robust backend validation and extended database persistence, it ensures complete data accuracy while maintaining security through enhanced role-based access control. 

**Updated** The recent refactoring to a hook-based architecture significantly improves code maintainability, testability, and reusability. The extraction of form handling logic into useOnboardingForm.ts custom hook and the creation of the reusable SectionCard.tsx component demonstrate adherence to React best practices and modern development patterns. The modular architecture supports easy extension and maintenance, following established patterns for authentication, authorization, and internationalization while delivering an exceptional user experience through automatic data loading, comprehensive validation, and intuitive cancellation options.

The refactored system maintains all existing functionality while providing a cleaner, more maintainable codebase that is easier to extend and test. The separation of concerns between presentation logic and form state management creates a solid foundation for future enhancements and improvements.