---
kind: design
name: Extract large monolithic components into page-scoped subdirectories
source: session
category: adr
---

# Extract large monolithic components into page-scoped subdirectories

_Source: coding plans from commit period 14c1b68 → ed1d779 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
Several frontend files exceeded 500+ lines (TimesheetFormEditor.tsx at 1149, FeedbacksPage.tsx at 749, SignaturePad.tsx at 754, OnboardingPage.tsx at 638, ProfileWizard.tsx at 622), making them hard to navigate and maintain. The plan calls for splitting each into focused sub-components under a `components/` directory within the owning page.

## Decision drivers
- file size reduction
- separation of concerns
- testability of smaller units

## Considered options
- **Keep monolithic files with inline comments** _(rejected)_ — pros: no refactoring cost, single file to edit; cons: hard to find logic, hard to test, merge conflicts grow with team size
- **Extract to shared `components/ui/` for reuse** _(rejected)_ — pros: maximizes reuse across pages; cons: many extracted pieces are page-specific and not reused elsewhere; would create false coupling in a shared layer
- **Extract to page-scoped `pages/<page>/components/` directories** — pros: keeps related code close, reduces coupling, still enables unit testing of sub-components; cons: some duplication if two pages share similar UI patterns later

## Decision
Split each oversized component into page-scoped sub-components under `pages/<feature>/components/`, keeping types and helpers in sibling `types/` and `helpers/` folders. Shared UI primitives stay in `components/ui/`; business components stay co-located with their page.

## Consequences
Largest files drop from 600–1100 lines to ~150–250 lines. Navigation improves and sub-components become independently testable. Future cross-page reuse can be evaluated when a genuine second consumer appears rather than preemptively sharing.