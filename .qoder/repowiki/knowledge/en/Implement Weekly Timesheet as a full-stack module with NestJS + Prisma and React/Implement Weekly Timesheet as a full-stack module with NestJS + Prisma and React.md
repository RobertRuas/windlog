---
kind: design
name: Implement Weekly Timesheet as a full-stack module with NestJS + Prisma and React + TanStack Query
source: session
category: adr
---

# Implement Weekly Timesheet as a full-stack module with NestJS + Prisma and React + TanStack Query

_Source: coding plans from commit period 549048c → 4cd1498 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The windlog project needed a new feature for managing weekly timesheets tied to existing projects. The original implementation was in standalone HTML/CSS/JS (timesheet_design directory), which needed to be migrated into the existing architecture.

## Decision drivers
- preserve original design fidelity
- use established tech stack (NestJS, Prisma, React)
- follow existing module patterns
- integrate with existing RBAC system

## Considered options
- **Full-stack module with NestJS + Prisma backend and React + TanStack Query frontend** — pros: Consistent with existing architecture, leverages established patterns, type-safe data layer, proper separation of concerns
- **Keep standalone HTML/CSS/JS implementation** _(rejected)_ — pros: Minimal changes to existing codebase; cons: Inconsistent with project architecture, no integration with auth/RBAC, no database persistence, maintenance burden

## Decision
Migrate the timesheet functionality into a dedicated NestJS module with Prisma schema definitions and a React-based frontend using TanStack Query for data management, following the established module structure pattern.

## Consequences
Creates a new module structure under API/src/modules/weekly-timesheet/ with proper DTOs, controllers, and services. Frontend components are organized under src/pages/weekly-timesheet/ with dedicated hooks and styles. Requires migration of existing timesheet_design assets and integration with existing Project and User models.