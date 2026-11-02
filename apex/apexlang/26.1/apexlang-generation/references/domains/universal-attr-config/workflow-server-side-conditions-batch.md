# Workflow: Server-Side Conditions — Batch Draft

Purpose
- Collect and preview server-side condition updates across multiple components/pages without applying finals.

Required inputs
- `operation`: draft | apply | revert (default `draft`).
- `mode`: token-based or explicit catalog type.
- `token`: server-side condition design token (when mode = token).
- `condition_type`: catalog type from 20-data/apex.logic.md (when mode = explicit).
- `attributes`: required fields for the chosen type (item, value/list, request value, plsqlExpression, sqlQuery, etc.).
- `targets`: list of page/component references (`Pnn_COMPONENT_TYPE.ID`).
- Optional single-target convenience input: `target` (same structure as one `targets` entry; normalized to a one-item list).
- Optional per-target overrides: alternative item/value/list, notes, apply=false flag.
- When `condition_type` = plsqlExpression, require the generator to apply the guardrails in 20-data/apex.logic.md section 8 (bind syntax, null safety, no DML/dynamic SQL) and capture the intent + expression in the preview.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/20-data/apex.logic.md
- Component/page rules resolved per target component type (e.g., `30-pages/apex.form.md`, `40-components/apex.items.md`).

Execution model
- Normalize `target` -> `targets`.
- Resolve the SSC definition (token or explicit type/attributes) against the catalog.
- For each target component:
  - Confirm the component supports `serverSideCondition {}`.
  - Merge shared SSC data with per-target overrides.
  - Collect a preview entry describing the component, resolved condition, and any missing attributes.
- Persist a compact run summary to `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` only when the workflow explicitly needs durable evidence.
- Do NOT apply direct app-file changes. Flag Missing Inputs when catalog requirements are incomplete.

Completion
- `operation: draft`: preview only; notify callers to re-run with approval to apply changes.
- `operation: apply`: revision applies approved entries and logs `state: applied`.
- `operation: revert`: revision restores entries from the referenced log record and logs `state: reverted`.
- Revision records the action reference in the compact run evidence when the workflow persists durable logs.

Notes
- Applies to buttons, items, regions, page processes, dynamic actions, validations, and other SSC-capable components.
- Maintain progressive disclosure; load only component rules relevant to targets.
- Multi-token runs require separate executions to keep change logs focused.
