---
kind: design
name: Implement Weekly Timesheet as a standalone NestJS module with Prisma models
source: session
category: adr
---

# Implement Weekly Timesheet as a standalone NestJS module with Prisma models

_Source: coding plans from commit period 626515e → ccc0fe1 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The project needed a full-stack weekly timesheet feature to track technician hours per project, replacing the existing static HTML/CSS/JS implementation in `timesheet_design/`.

## Decision drivers
- preserving original HTML/CSS/JS design fidelity
- NestJS + Prisma backend architecture consistency
- React + TanStack Query frontend pattern
- RBAC integration with existing User/Project models

## Considered options
- **Standalone NestJS module with Prisma schema** — pros: Clean separation of concerns, reuses existing User/Project relations, follows established patterns
- **Monolithic controller approach** — pros: Simpler initial setup; cons: Violates modular architecture, harder to maintain long-term

## Decision
Create a dedicated `weekly-timesheet` NestJS module under `API/src/modules/weekly-timesheet/` with three Prisma models (`WeeklyTimesheet`, `WeeklyTimesheetDay`, `WeeklyTimesheetEntry`) and corresponding REST endpoints. Frontend implemented as React components under `src/pages/weekly-timesheet/` using TanStack Query for data fetching.

## Consequences
Three new database tables with cascade deletes, soft delete via `deletedAt`, status workflow (DRAFT → SUBMITTED → APPROVED), and RBAC based on user roles and project membership. The original `timesheet_design/` directory is removed after migration.