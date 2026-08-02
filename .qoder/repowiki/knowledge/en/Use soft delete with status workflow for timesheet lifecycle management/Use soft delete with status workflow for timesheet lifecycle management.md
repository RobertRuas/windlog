---
kind: design
name: Use soft delete with status workflow for timesheet lifecycle management
source: session
category: adr
---

# Use soft delete with status workflow for timesheet lifecycle management

_Source: coding plans from commit period 549048c → 4cd1498 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
Timesheets need to support different states (draft, submitted, approved) and require deletion capabilities while maintaining audit trails for compliance purposes.

## Decision drivers
- audit trail requirements
- data recovery capability
- workflow state management
- compliance with existing patterns

## Considered options
- **Soft delete with TimesheetStatus enum (DRAFT/SUBMITTED/APPROVED)** — pros: Maintains historical data, supports approval workflow, consistent with existing LogAction patterns
- **Hard delete with separate audit table** _(rejected)_ — pros: Cleaner database schema; cons: Loss of historical data, more complex audit implementation, breaks referential integrity

## Decision
Implement soft delete using deletedAt timestamp on WeeklyTimesheet model combined with a TimesheetStatus enum that tracks the workflow from DRAFT through SUBMITTED to APPROVED, with corresponding LogAction entries for each state change.

## Consequences
All queries must filter out soft-deleted records. Status transitions trigger appropriate log actions (TIMESHEET_CREATE, TIMESHEET_UPDATE, TIMESHEET_DELETE, TIMESHEET_SUBMIT, TIMESHEET_APPROVE). Deletion is permanent only when combined with status checks.