---
name: page-items
description: Configure Oracle APEX page items the Items skill. Use when Codex must add or adjust page items under APEX Developer guardrails.
---

# Reference Package — Page Items & LOVs

**Parent Entries:** `references/domains/README.md` (domain), `SKILL.md` (router)

## Purpose
- Add or modify page items with correct types, LOVs, format masks, validations, and computations.
- Leverage canonical item templates under `templates/items/`.

## When to Trigger
- The user requests new items or updates to existing items (type, LOV, default, validation, computation).
- Use alongside Region/Template sub-skills for full page composition.

## Required Inputs
- Item names, desired types (text, select list, checkbox, etc.)
- LOV source (static or SQL) with value/display columns
- Validation requirements and error messages
- Computation context (execution point, body, target item)

## Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/memory-bank/10-global/apex.global.md`
- `references/policies/memory-bank/40-components/apex.templates.md`
- `references/policies/memory-bank/40-components/apex.items.md`
- `references/policies/memory-bank/20-data/apex.sql.md`
- `references/policies/memory-bank/20-data/apex.logic.md`
- `references/policies/governance/00-governance.md`

## Operational References
- Templates: `templates/items/*`
- `references/domains/page-components/page-items/templates.md`
- `references/domains/page-components/page-items/registry.md`
- Business-logic coupling: `references/domains/README.md` for computations/validations workflows

## Execution Agents
- `references/ops/sqlcl-agents/00-connection-gate.md` when DB validation is needed.
- `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md` for import-ready completion checks.
- `references/ops/runtime-gates/01-direct-sqlcl-import.md` for online import runs.
- The internal generate/review/fix loop remains under `references/workflows/apex-generation/agents/`.

## Guardrails
- Computations: `type: expression` for PL/SQL expressions; scalar SQL computations require `type: sqlQuerySingleValue`, and multi-value SQL computations require `type: sqlQueryMultipleValues`.
- LOV SQL wrapped in triple backticks; no fabricated columns.
- Validation logic adheres to `apex.logic` policies (invokeApi, named notation, SSC catalog).
- Missing inputs must be flagged (no guesses for PK or LOV details).
- Default visible item templates and label presentation are owned by the shared composition contract in `references/policies/memory-bank/40-components/apex.templates.md`, not by styling workflows.

## Agent Flow
- Invoke `references/ops/sqlcl-agents/00-connection-gate.md` when DB validation is needed.
- Use the internal generate -> review -> fix loop via APEX Developer agents, referencing business-logic prompts when computations/validations are involved.
- For import-ready runs, execute `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`.
- After runtime gate pass, import via `references/ops/runtime-gates/01-direct-sqlcl-import.md` proceeds automatically.

## Outputs & Acceptance
- Item definitions updated in target page file.
- LOV definitions added to shared components if required.
- Computations/validations logged with correct request guards.

## References
- `references/domains/page-components/page-items/templates.md` (template paths)
- `references/domains/page-components/page-items/registry.md` (keyword → template mapping)
- `references/domains/README.md` for validations/computations/dynamic actions

Use this package for any page item, LOV, validation, or computation tasks within APEX Developer.
