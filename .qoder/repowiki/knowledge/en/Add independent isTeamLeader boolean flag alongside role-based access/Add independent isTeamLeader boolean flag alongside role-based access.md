---
kind: design
name: Add independent isTeamLeader boolean flag alongside role-based access
source: session
category: adr
---

# Add independent isTeamLeader boolean flag alongside role-based access

_Source: coding plans from commit period 29438ed → 14c1b68 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
The system needed a way to grant timesheet creation/editing permissions to non-ADMIN/HR users without changing their Role. The existing irataLevel technical level and Role fields were insufficient for this business requirement.

## Decision drivers
- separation of concerns between role-based system access and feature-level permissions
- minimal schema change (single boolean field)
- consistent permission logic across frontend and backend

## Considered options
- **Extend Role enum with TEAM_LEADER** — pros: centralized in one place; cons: mixes system access control with feature permissions; requires migration of all role checks
- **Add isTeamLeader boolean flag** — pros: independent from Role, minimal change, clear separation between system access (Role) and feature permissions (isTeamLeader); cons: requires checking two fields everywhere

## Decision
Add an independent `isTeamLeader` boolean field on the User model (default false), separate from both Role and irataLevel. Permission logic uses OR: `role !== 'STANDARD' || isTeamLeader` grants timesheet operations.

## Consequences
Permission checks must now evaluate both Role and isTeamLeader consistently across the API (weekly-timesheet service) and frontend (WeeklyTimesheetPage, WeeklyTimesheetDetailPage). The UserModal needs a toggle for this field, and UsersTable needs a visual indicator. Seed data should include some team leaders for testing.