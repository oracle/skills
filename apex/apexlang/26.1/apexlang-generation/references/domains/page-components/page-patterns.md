---
name: page-patterns
description: Scaffold Oracle APEX page-patterns, page or app navigation, and breadcrumbs using the page-scaffolding workflow. Use when Codex must create new APEXlang pages or adjust page-level metadata under the Page Scaffolding & Navigation recipe.
---

# Reference Package — Page Patterns & Navigation

**Parent Entries:** `references/domains/README.md` (domain), `SKILL.md` (router)

This skill executes the page-patterns playbook defined in this repository. It ensures new pages follow standards for naming, navigation, breadcrumbs, and page groups, while honoring guardrails.

---

## Purpose
- Add a new page with correct metadata, navigation list entry, and breadcrumb.
- Apply page-group assignments and server-side conditions using approved catalog types.

## When to Trigger
- The user requests a new page scaffold, navigation/breadcrumb updates, or page-group assignments.
- Use for page-level adjustments before adding specific regions or items.

---

## Required Inputs
- `page_number`
- `navigation_list_target`
- `breadcrumb_target`
- Optional: `page_group` (e.g., `@administration`)
- Flags: `add_navigation` (default true for non-modal pages), `add_breadcrumb` (default true for non-modal pages)

### Progressive Prompts (Server-Side Conditions)
1. “Do any components on this page require a server-side condition? (Reply ‘none’ to skip.)”
2. If yes, capture `scope` (button, region, item, dynamic action, or process) and `identifier`.
3. Request the catalog `type` or SSC token from `references/policies/memory-bank/20-data/apex.logic.md`.
4. Collect required attributes (`item`, `value/list`, `requestValue`, `plsqlExpression`, `sqlQuery`, etc.). Missing answers halt the workflow.

---

## Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/governance/00-governance.md`
- `assets/rules-mapping.json`
- Load minimal domain rules from:
  - `references/policies/memory-bank/10-global/apex.global.md`
  - `references/policies/memory-bank/30-pages/apex.page.md`
  - `references/policies/memory-bank/20-data/apex.logic.md` (only when SSC is requested)

## Operational References
- `references/domains/page-components/page-patterns/templates.md`
- `references/domains/page-components/page-patterns/registry.md`
- APEX page templates under `templates/page-examples/**`
- Do not use `applications/**` as a page-pattern source; target-app reads remain integration-only.

## Execution Agents
- `references/ops/sqlcl-agents/00-connection-gate.md` (pre-agent saved-connection resolution).
- `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md` (import-ready completion checks).
- The internal generate/review/fix loop remains under `references/workflows/apex-generation/agents/`.
- `references/ops/runtime-gates/01-direct-sqlcl-import.md` for online import runs.

---

## Rule Loading (Minimal Context)
1. `references/policies/memory-bank/00-guard/ai.guard.md`
2. `references/policies/governance/00-governance.md`
3. `assets/rules-mapping.json`
4. Via rules map:
   - `references/policies/memory-bank/10-global/apex.global.md`
   - `references/policies/memory-bank/30-pages/apex.page.md`
   - `references/policies/memory-bank/20-data/apex.logic.md` only when server-side conditions are requested
5. Templates referenced as needed from `templates/**`

---

## Agent Flow Integration
- Invoke `references/ops/sqlcl-agents/00-connection-gate.md` (Pre-Agent 0) to resolve `db_connection_name` for live metadata and roundtrip work.
- The apexdev master standards use a transient temp workspace outside the repo for generation and review, require an internal confidence score of at least `0.95`, and publish to `applications/<target-app>/...` only after the resolved live runtime action succeeds when a live roundtrip is requested.
- For import-ready runs, execute `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`.
- After runtime gate pass, call `references/ops/runtime-gates/01-direct-sqlcl-import.md` automatically; do not wait for a separate import approval.

---

## Outputs & Acceptance Gates
- When `add_navigation: true`: append entry to `shared-components/lists.apx` under `navigation-menu`, linking `f?p=&APP_ID.:&PAGE_ID.:&APP_SESSION.::&DEBUG.:::` with appropriate sequence.
- When `add_navigation: true` and the navigation entry emits `isCurrent { type: pages }`, set `pages` to the new entry's own page id only.
- If a related page also needs navigation, create a separate list entry for that page instead of appending its page id to another entry's `isCurrent.pages` value.
- When `add_breadcrumb: true`: append breadcrumb entry to `shared-components/breadcrumbs.apx`.
- When `add_breadcrumb: true`: add a visible page breadcrumb region with `type: breadcrumb` and `source.breadcrumb: @breadcrumb`.
- When `page_group` provided: set `pageGroup` at the page root (not inside appearance/nav/css/security).
- Fail if a non-modal user page lacks required nav, a matching breadcrumb entry, or a visible breadcrumb region when flags are true.
- Fail if a requested server-side condition is missing catalog type or required attributes.

---

## Guardrails to Enforce
- Minimal rule loading; never touch `.archive/`.
- No invented attributes or UT classes.
- Server-side conditions must use supported catalog types from `20-data/apex.logic.md`.
- For navigation current-state metadata, do not emit comma-separated `isCurrent.pages` values for different pages that already have their own navigation entries.
- Respect process policy split when adding processes (page process invokeApi-default with thin-wrapper exception; appProcess executeCode-only). Defer to page-specific workflows for full process logic.
- Record Missing Inputs instead of fabricating values.

---

## Completion Checklist
1. Working page changes stay in the transient temp workspace until review passes.
2. The internal review loop records PASS/CONFIDENCE in the compact runtime report when the workflow reaches runtime gates.
3. Final page artifact updates `applications/app_###/pages/` unless the calling master passes a resolved application path.
4. Execute the import runtime gate for import-ready runs.
5. Run Import Changes Gate after the live APEXlang check succeeds.

---

## Examples
- “Create Page 42 ‘Customer Dashboard’, add it to Navigation Menu under Administration, breadcrumb ‘Customers’, assign page group `@administration`.”
- “Add a new modal page 120 and hide its navigation entry; ensure no breadcrumb is emitted.”

---

Use this package whenever page scaffolding or navigation adjustments are needed prior to populating regions and items.
