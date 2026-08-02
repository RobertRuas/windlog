---
kind: external_dependency
name: Prisma ORM v7 with PostgreSQL Adapter
slug: prisma
category: external_dependency
category_hints:
    - sdk_real_api
    - migration_status
scope:
    - '**'
---

Prisma v7 is used as the ORM with PostgreSQL adapter (@prisma/adapter-pg). The schema defines all models (User, Project, Notification, SystemLog, etc.) with UUID IDs, UTC timestamps, and soft delete patterns. Client generation outputs to ./generated/prisma (not node_modules). Database URL is configured in prisma.config.ts per Prisma v7 requirements. Migrations are managed through prisma migrate dev and seed data via tsx prisma/seed.ts.