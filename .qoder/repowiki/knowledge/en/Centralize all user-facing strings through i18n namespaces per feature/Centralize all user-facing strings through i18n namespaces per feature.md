---
kind: design
name: Centralize all user-facing strings through i18n namespaces per feature
source: session
category: adr
---

# Centralize all user-facing strings through i18n namespaces per feature

_Source: coding plans from commit period 14c1b68 → ed1d779 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
~35 hardcoded English strings were found across 9 frontend files (feedback, notifications, timesheet, common labels, aria-labels, toast messages). The project uses an existing `src/i18n/locales/pt/` structure but many features lacked dedicated namespaces.

## Decision drivers
- internationalization completeness
- accessibility via aria-labels
- consistent translation workflow

## Considered options
- **Leave internationalized export strings in English** — pros: timesheets are international documents; clients expect English headers; cons: inconsistent treatment — some strings translated, others not
- **Translate every string including export templates** _(rejected)_ — pros: fully consistent i18n coverage; cons: breaks the expectation that exported timesheets are in English for international clients

## Decision
Move all user-facing UI strings into feature-scoped i18n JSON files (`feedback.json`, `notifications.json`, `timesheet.json`, `common.json`). Keep Excel export and timesheet document templates intentionally in English since they represent international client deliverables; do not translate those.

## Consequences
UI text is now fully translatable and accessible. Export/document strings remain hardcoded in English by design, which is acceptable because they model external-facing documents rather than UI prompts. A future decision point exists if the product adds non-English export variants.