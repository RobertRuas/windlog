---
kind: design
name: Use granular RBAC based on role and project membership for timesheet access
source: session
category: adr
---

# Use granular RBAC based on role and project membership for timesheet access

_Source: coding plans from commit period 626515e → ccc0fe1 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
Timesheets contain sensitive project and personnel data that need controlled access beyond simple authentication.

## Decision drivers
- security for project-sensitive data
- least-privilege principle
- existing role system compatibility

## Considered options
- **Role-based + project membership checks** — pros: ADMIN/HR can manage all timesheets, Team Leaders can edit their projects, viewers limited to entries they appear in
- **Simple authenticated-only access** — pros: Simpler implementation; cons: Too permissive for project-specific data

## Decision
Implement RBAC where creation/editing requires ADMIN, HR, or 'Team Leader' position on the linked project; viewing is restricted to authenticated users whose names appear in timesheet entries.

## Consequences
Complex authorization logic in service layer checking both user roles and entry membership. Prevents unauthorized access while allowing collaborative editing within project teams.