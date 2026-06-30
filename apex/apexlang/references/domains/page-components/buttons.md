---
name: buttons
description: Configure Oracle APEX buttons, confirmation dialogs, and apply/remove actions using canonical templates and guardrails. Use when Codex must add, update, or remove buttons within Apex Developer flows.
---

# Reference Package — Buttons & Actions

**Parent Entries:** `references/domains/README.md` (domain), `SKILL.md` (router)

## Purpose
- Apply or remove button components with consistent layout, behavior, and confirmations.
- Enforce button-specific guardrails before integrating with business logic or process batches.

## When to Trigger
- The user requests button additions/updates/removals across pages or regions, including one-target operations.
- Combine with Business Logic or Universal Attribute skills for validations, SSC, or help text.

## Required Inputs
- `operation`: apply | remove (default apply).
- `action_type`: submitPage | redirectThisApp | redirectOtherApp | triggerAction | menu (required for apply).
- Layout defaults (slot, sequence, region static ID).
- Appearance defaults (template, icon, hot/disabled flags, and canonical emitted `templateOptions` values from the button contract).
- Behavior defaults (confirmations, targets, warnOnUnsavedChanges, nested entries).
- Canonical `targets` list with per-target overrides, or a single `target` convenience object.
- Backward compatibility: `target_buttons` / `target_button` are accepted and normalized to `targets`.

## Authoritative Policies
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/memory-bank/10-global/apex.global.md`
- `references/policies/memory-bank/40-components/apex.buttons.md`
- `references/policies/memory-bank/20-data/apex.logic.md`
- `references/policies/governance/00-governance.md`

## Operational References
- Templates from `templates/buttons/`
- `references/domains/page-components/buttons/templates.md`
- `references/domains/page-components/buttons/registry.md`
- `assets/domains/page-components/buttons/button-actions.md`
- Optional workflow coupling: `references/domains/README.md`, `references/domains/README.md`

## Execution Agents
- `references/ops/sqlcl-agents/00-connection-gate.md` (when DB-aware validation is required).
- `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md` for import-ready completion checks.
- The internal generate/review/fix loop remains under `references/workflows/apex-generation/agents/`.

## Guardrails
- Validate action_type requirements (targets for redirects, databaseAction for submit DML, nested menus for children).
- Require canonical emitted button templateOptions values such as `t-Button--iconLeft` and reject aliases/static_ids such as `left`.
- For `@/text-with-icon` buttons with icons, default to `t-Button--iconLeft`; use `t-Button--iconRight` only when explicitly requested and omit both for `@/icon`.
- For remove operations, perform hard-delete dependency checks before applying changes; block on dangling references (DA aliases, whenButtonPressed, request guards).
- Confirmation messages must follow governance: no hard-coded PII, inline help < 60 chars.
- Ensure layout slots exist for the target region template.
- For submitPage actions, remind to guard processes via invokeApi (Business Logic skill).
- Record Missing Inputs when required overrides are absent.

## Outputs & Workflow
1. Generate button changes in the transient temp workspace and keep the review summary compact.
2. Review ensures guardrails (template attributes, nested behaviors, confirmation text) are satisfied.
3. Apply approved fixes and publish only after the run clears the required gates.
4. For import-ready runs, execute `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md` before completion.

## References
- `references/domains/page-components/buttons/templates.md`
- `references/domains/page-components/buttons/registry.md`
- Reusable prompts: `assets/domains/page-components/buttons/button-actions.md`

Use this package whenever button configuration or batch actions are required in Apex Developer flows.
