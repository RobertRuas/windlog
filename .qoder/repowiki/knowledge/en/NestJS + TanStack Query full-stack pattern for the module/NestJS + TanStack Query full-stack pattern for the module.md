---
kind: design
name: NestJS + TanStack Query full-stack pattern for the module
source: session
category: adr
---

# NestJS + TanStack Query full-stack pattern for the module

_Source: coding plans from commit period ccc0fe1 → 1fa1d90 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The Weekly Timesheet feature spans both backend API and frontend UI. A consistent request/response pattern was needed to avoid ad-hoc fetch calls and to leverage caching, mutations, and type safety across the stack.

## Decision drivers
- consistent API contract
- client-side caching and optimistic updates
- type safety end-to-end
- reuse of existing NestJS + Prisma patterns

## Considered options
- **NestJS REST controllers + TanStack Query hooks** — pros: familiar stack, automatic caching/mutations, clean separation of concerns, reusable service layer
- **GraphQL with Apollo Client** _(rejected)_ — pros: flexible queries, single endpoint; cons: additional complexity, overkill for CRUD-heavy feature, not already in use
- **Direct fetch/axios calls without a client library** _(rejected)_ — pros: minimal dependency; cons: no caching, manual loading/error state, duplicated logic across components

## Decision
Implement a NestJS module under `src/modules/weekly-timesheet/` with controller/service/DTOs, and a corresponding `weekly-timesheet.service.ts` on the frontend using TanStack Query hooks (`useTimesheetMutations`, etc.) for all data operations.

## Consequences
Each CRUD operation follows the same pattern: DTO validation on the server, typed responses, and React hooks handling loading/error/success states. Adding new endpoints or mutating existing ones requires matching changes on both sides.