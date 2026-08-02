---
kind: design
name: Implement role-based access control for timesheet operations
source: session
category: adr
---

# Implement role-based access control for timesheet operations

_Source: coding plans from commit period 549048c → 4cd1498 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
Different user roles need different levels of access to timesheet functionality - creation/editing should be restricted while viewing should be available to team members involved in specific timesheets.

## Decision drivers
- security requirements
- existing RBAC infrastructure
- team collaboration needs
- minimal permission complexity

## Considered options
- **Role-based permissions (ADMIN, HR, Team Leader) plus content-based visibility** — pros: Leverages existing RBAC system, allows granular control, supports team-based visibility
- **Simple authenticated-only access** _(rejected)_ — pros: Simpler implementation; cons: Too permissive, doesn't match business requirements for selective visibility

## Decision
Restrict creation/editing to users with ADMIN or HR roles, or Team Leader position on the linked project. Allow viewing to any authenticated user whose name appears in the timesheet entries, providing both role-based and content-based access control.

## Consequences
Requires checking both user roles and project membership at runtime. View permissions are dynamic based on timesheet content rather than static role assignments. Creates dependency on ProjectMember relationships for fine-grained access control.