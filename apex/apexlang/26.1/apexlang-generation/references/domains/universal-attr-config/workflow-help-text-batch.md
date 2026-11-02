# Workflow: Help Text — Batch Draft

Purpose
- Collect, preview, and validate help text updates across pages, regions, items, buttons, and validations without applying finals.

Required inputs
- `operation`: draft | apply | revert (default `draft`).
- `scope`: page | item | button | validation.
- `targets`: list of component identifiers (`Pnn_COMPONENT`, region/process alias).
- Optional single-target convenience input: `target` (same structure as one `targets` entry; normalized to a one-item list).
- `source_type`: text_message | column_comment | manual_review.
- `text_message_key`: required when source_type = text_message.
- `authoritative_source`: reference (column comment, SOP, ticket) when source_type ≠ text_message.
- `inline_help`: short hint (≤60 characters) when applicable.
- `detailed_help`: full help text (≤400 characters) when applicable.
- `localization`: languages requesting translation (ISO codes) or `none`.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/30-pages/apex.page.md (page/regional help)
- references/policies/memory-bank/30-pages/apex.form.md (form items)
- references/policies/memory-bank/40-components/apex.items.md
- references/domains/universal-attr-config/reusable-prompts/help_text.md

Execution model
- Normalize `target` -> `targets`.
- Validate scope/component compatibility (e.g., inline help only for items supporting it; regions lack intrinsic help attributes).
- For each target:
  - Confirm source_type alignment (Text Message preferred; column comments must be production-ready).
  - Merge shared inputs with per-target overrides (custom TM keys, copy tweaks).
  - Generate preview entry capturing intent, inline help, detailed help, Text Message references, and localization notes.
  - Enforce guardrails: text length limits, no hard-coded literals, professional tone, no PII/credentials, alignment with section 8 when `plsqlExpression` is referenced.
  - Record violations as Missing Inputs or Required Revisions; block drafts when critical data is absent.
- Persist a compact run summary to `the temp-runtime logs directory under `APEXLANG_OUTPUT_ROOT/logs/`` only when the workflow explicitly needs durable evidence.
- `operation: draft` does not apply direct app-file changes yet.

Completion
- Output status summary (ready vs blocked targets). Highlight missing TM keys or translation tasks.
- `operation: draft`: keep help text changes in the transient temp workspace until approval.
- `operation: apply`: revision applies approved help text and records a compact status entry only when needed.
- `operation: revert`: revision restores the previous state using the recorded run context when durable evidence exists.

Notes
- Inline help must remain ≤60 characters; detailed help ≤400 characters unless governance updates say otherwise.
- Encourage Text Messages for localization; when using column comments/manual review, schedule translation key creation.
- Content must differentiate user-facing help from developer comments; comments block remains for internal notes.
- Pair with translation workflows when `localization` includes languages beyond the default.
