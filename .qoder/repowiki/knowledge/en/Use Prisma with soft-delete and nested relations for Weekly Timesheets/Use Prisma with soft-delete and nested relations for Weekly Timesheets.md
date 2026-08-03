---
kind: design
name: Use Prisma with soft-delete and nested relations for Weekly Timesheets
source: session
category: adr
---

# Use Prisma with soft-delete and nested relations for Weekly Timesheets

_Source: coding plans from commit period ccc0fe1 → 1fa1d90 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The new Weekly Timesheet module requires a relational data model that captures timesheets, days within each week, and entries per day, all linked to existing Project and User entities. The system needs auditability (deletedAt), status tracking (DRAFT/SUBMITTED/APPROVED), and cascading deletes to keep the hierarchy consistent.

## Decision drivers
- relational integrity between timesheets, days, and entries
- audit trail via soft delete
- cascading consistency across nested entities
- existing Prisma stack

## Considered options
- **Prisma schema with nested models and soft delete** — pros: native cascade support, type-safe queries, fits existing backend stack, easy migration from existing Project/User models
- **Flat denormalized table with JSON fields** _(rejected)_ — pros: simpler reads, fewer joins; cons: loses referential integrity, harder to query by day/entry, no cascade behavior, harder to evolve schema

## Decision
Model the domain as three Prisma entities — WeeklyTimesheet, WeeklyTimesheetDay, WeeklyTimesheetEntry — with foreign keys, indexes on projectId/createdBy/week/userId, and a deletedAt soft-delete column. Status is tracked via an enum TimesheetStatus.

## Consequences
Queries will join across three tables but gain strong consistency and clear ownership relationships. Soft delete means all queries must filter out deletedAt records. The nested structure supports the spreadsheet-like UI where days contain multiple entries.