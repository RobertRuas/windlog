# Database and Prisma

<cite>
**Referenced Files in This Document**
- [schema.prisma](file://API/prisma/schema.prisma)
- [prisma.service.ts](file://API/src/database/prisma.service.ts)
</cite>

## Table of Contents
- Schema Prisma
- Modeling Conventions
- Soft Delete
- Migrations
- Data Seeding

## Schema Prisma
This section documents the Prisma schema that defines the data model for the Windlog backend. The schema is located at API/prisma/schema.prisma and is consumed by the NestJS application through a dedicated Prisma service.

Key aspects to consider when working with the schema:
- Entities are modeled as Prisma models with UUID primary keys.
- Relationships are expressed using Prisma relation fields and foreign keys.
- Timestamps are managed consistently across entities.
- Audit and soft delete fields are included where applicable.
- Enums are used for constrained fields such as roles, statuses, and types.

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
  - Model names are singular and PascalCase (e.g., User, Project).
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
  - Domain-specific enums are defined for constrained values (e.g., roles, statuses).
  - Enum values are documented and versioned carefully.

- Validation
  - Constraints are enforced at the schema level (unique, required, length).
  - Business validation is performed in DTOs and services.

These conventions align with the project’s emphasis on consistency and readability across the codebase.

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

Adhering to these practices minimizes risk and maintains database consistency across environments.

[No sources needed since this section provides general guidance]

## Seed de Dados
Data seeding supports local development and testing:

- Purpose
  - Populate the database with realistic sample data.
  - Ensure consistent baseline data for feature development and tests.

- Content
  - Seeders typically include users with different roles (ADMIN, HR, STANDARD).
  - Sample projects, logs, notifications, and related entities are created.

- Execution
  - Run seeders in development and test environments.
  - Avoid running seeders in production unless explicitly required.

- Maintenance
  - Update seeders when schema changes affect existing data structures.
  - Validate seeded data integrity regularly.

Seeding accelerates setup and improves developer productivity while maintaining reliable test scenarios.

[No sources needed since this section provides general guidance]