---
kind: design
name: RBAC based on role + project membership rather than global permissions
source: session
category: adr
---

# RBAC based on role + project membership rather than global permissions

_Source: coding plans from commit period ccc0fe1 → 1fa1d90 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
Access to timesheets must be scoped: creation is limited to ADMIN, HR, or Team Leader positions tied to a specific project; viewing/editing is restricted to users whose names appear in timesheet entries. This avoids a flat permission matrix while keeping project-scoped access control simple.

## Decision drivers
- project-scoped authorization
- minimal RBAC surface area
- alignment with existing User/ProjectMember models

## Considered options
- **Role + project membership checks in service layer** — pros: simple rules, leverages existing User.role and ProjectMember, no extra policy engine
- **Centralized policy engine (e.g., CASL)** _(rejected)_ — pros: expressive rules, reusable across modules; cons: adds dependency, over-engineering for this feature's straightforward rules

## Decision
Enforce creation rights by checking user role (ADMIN, HR) or position 'Team Leader' against the target project; allow view/edit/delete only when the authenticated user's name appears in at least one entry of the timesheet.

## Consequences
Authorization logic lives in the service/controller layer and depends on the relationship between User, ProjectMember, and WeeklyTimesheetEntry. No additional permission tables are needed, but rules must be replicated consistently across create/update/delete/submit endpoints.