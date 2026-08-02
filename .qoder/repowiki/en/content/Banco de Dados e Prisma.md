# Database and Prisma

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://API/prisma/schema.prisma)
- [prisma.service.ts](file://API/src/database/prisma.service.ts)
- [weekly-timesheet.controller.ts](file://API/src/modules/weekly-timesheet/weekly-timesheet.controller.ts)
- [weekly-timesheet.service.ts](file://API/src/modules/weekly-timesheet/weekly-timesheet.service.ts)
- [create-timesheet.dto.ts](file://API/src/modules/weekly-timesheet/dto/create-timesheet.dto.ts)
- [update-timesheet.dto.ts](file://API/src/modules/weekly-timesheet/dto/update-timesheet.dto.ts)
- [timesheet-filter.dto.ts](file://API/src/modules/weekly-timesheet/dto/timesheet-filter.dto.ts)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive documentation for the new WeeklyTimesheet model and related entities
- Updated schema section to include timesheet data structures
- Enhanced modeling conventions with timesheet-specific patterns
- Added new migration documentation covering timesheet schema evolution
- Expanded soft delete implementation details for timesheet entities

## Table of Contents
- Schema Prisma
- Modeling Conventions
- Soft Delete
- Migrations
- Data Seeding
- Timesheet Data Structures

## Schema Prisma
This section documents the Prisma schema that defines the data model for the Windlog backend. The schema is located at API/prisma/schema.prisma and is consumed by the NestJS application through a dedicated Prisma service.

Key aspects to consider when working with the schema:
- Entities are modeled as Prisma models with UUID primary keys.
- Relationships are expressed using Prisma relation fields and foreign keys.
- Timestamps are managed consistently across entities.
- Audit and soft delete fields are included where applicable.
- Enums are used for constrained fields such as roles, statuses, and types.
- **Updated**: The schema now includes comprehensive timesheet data structures supporting weekly time tracking functionality.

The Prisma client is provided via a NestJS service (API/src/database/prisma.service.ts), which should be injected into modules and services to perform database operations.

**Section sources**
- [schema.prisma](file://API/prisma/schema.prisma)
- [prisma.service.ts](file://API/src/database/prisma.service.ts)

## Modeling Conventions
The project follows consistent modeling conventions to ensure clarity, maintainability, and reliability:

- Primary Keys
  - All core entities use UUID as the identifier type.
  - IDs are generated at creation time and never reused.

- Naming
  - Model names are singular and PascalCase (e.g., User, Project, WeeklyTimesheet).
  - Field names are camelCase and descriptive.
  - Foreign key fields follow the pattern {relatedEntity}Id.

- Timestamps
  - Created and updated timestamps are present on most entities.
  - All timestamps are stored in UTC.

- Relations
  - One-to-many relations are defined with explicit foreign keys.
  - Many-to-many relations use a join table model.
  - Cascade behaviors are explicitly configured where appropriate.

- Enums
  - Domain-specific enums are defined for constrained values (e.g., roles, statuses, timesheet types).
  - Enum values are documented and versioned carefully.

- Validation
  - Constraints are enforced at the schema level (unique, required, length).
  - Business validation is performed in DTOs and services.

- **Updated**: Timesheet entities follow specialized patterns for time tracking data including date ranges, work hours, and approval workflows.

These conventions align with the project's emphasis on consistency and readability across the codebase.

**Section sources**
- [schema.prisma](file://API/prisma/schema.prisma)

## Soft Delete
Soft delete is implemented across all main entities to preserve historical data and support auditability:

- deletedAt field
  - Each entity includes a nullable timestamp field named deletedAt.
  - Records are marked as deleted by setting deletedAt rather than removing rows.

- Querying
  - Queries must exclude soft-deleted records unless explicitly requested.
  - Use Prisma filters to include or exclude deleted records based on context.

- Cleanup
  - Periodic jobs may purge old soft-deleted records according to retention policies.
  - Admin tools can permanently remove soft-deleted records after confirmation.

- UI/UX
  - Deleted items are hidden from standard views.
  - Admin interfaces allow viewing and restoring soft-deleted records when necessary.

- **Updated**: Timesheet entities implement soft delete to maintain historical time tracking data integrity while allowing administrative cleanup.

This approach ensures data integrity while providing flexibility for recovery and auditing.

**Section sources**
- [schema.prisma](file://API/prisma/schema.prisma)

## Migrations
Migrations manage schema evolution safely and reproducibly:

- Workflow
  - Changes to the schema are captured via migration files.
  - Migrations are applied in order and tracked in the database.

- Best Practices
  - Keep migrations small and focused on a single change.
  - Include rollback strategies for destructive changes.
  - Test migrations against a staging environment before production.

- Commands
  - Generate new migrations when modifying the schema.
  - Apply pending migrations to the target database.
  - Reset or seed data as needed during development.

- Version Control
  - Migration files are committed alongside schema changes.
  - Avoid manual edits to applied migrations; create new ones instead.

- **Updated**: Recent migrations include comprehensive timesheet schema additions with 223 new lines supporting complete time tracking functionality including weekly timesheets, daily entries, and approval workflows.

Adhering to these practices minimizes risk and maintains database consistency across environments.

**Section sources**
- [schema.prisma](file://API/prisma/schema.prisma)

## Data Seeding
Data seeding supports local development and testing:

- Purpose
  - Populate the database with realistic sample data.
  - Ensure consistent baseline data for feature development and tests.

- Content
  - Seeders typically include users with different roles (ADMIN, HR, STANDARD).
  - Sample projects, logs, notifications, and related entities are created.
  - **Updated**: Seeders now include sample timesheet data with various work patterns, approval states, and user assignments.

- Execution
  - Run seeders in development and test environments.
  - Avoid running seeders in production unless explicitly required.

- Maintenance
  - Update seeders when schema changes affect existing data structures.
  - Validate seeded data integrity regularly.

Seeding accelerates setup and improves developer productivity while maintaining reliable test scenarios.

**Section sources**
- [schema.prisma](file://API/prisma/schema.prisma)

## Timesheet Data Structures
The system now includes comprehensive timesheet functionality for tracking weekly work hours and project time allocation:

### Core Timesheet Models
- **WeeklyTimesheet**: Main entity representing a week's time tracking period
  - Contains date range definitions (start/end dates)
  - Links to specific projects and team members
  - Supports multiple status states (draft, submitted, approved, rejected)
  - Includes approval workflow fields

- **TimesheetEntry**: Individual daily time entries within a weekly timesheet
  - Represents work done on specific days
  - Tracks hours worked per day
  - Includes task descriptions and project associations
  - Supports comment fields for detailed notes

- **TimesheetApproval**: Approval workflow tracking
  - Manages approval chains and signatures
  - Tracks approval status and timestamps
  - Supports multi-level approval processes

### Data Relationships
- WeeklyTimesheet has many TimesheetEntry records
- TimesheetEntry belongs to a specific WeeklyTimesheet
- Both entities link to Users and Projects
- Approval workflow creates hierarchical relationships

### Time Tracking Features
- Daily hour tracking with precision to minutes
- Project-based time allocation
- Multi-user collaboration support
- Approval and signature workflows
- Historical data preservation through soft deletes

### API Integration
The timesheet functionality is exposed through dedicated controllers and services:
- RESTful endpoints for CRUD operations
- Filtering and pagination support
- Export capabilities for reporting
- Real-time status updates

**Section sources**
- [weekly-timesheet.controller.ts](file://API/src/modules/weekly-timesheet/weekly-timesheet.controller.ts)
- [weekly-timesheet.service.ts](file://API/src/modules/weekly-timesheet/weekly-timesheet.service.ts)
- [create-timesheet.dto.ts](file://API/src/modules/weekly-timesheet/dto/create-timesheet.dto.ts)
- [update-timesheet.dto.ts](file://API/src/modules/weekly-timesheet/dto/update-timesheet.dto.ts)
- [timesheet-filter.dto.ts](file://API/src/modules/weekly-timesheet/dto/timesheet-filter.dto.ts)