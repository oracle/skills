# Workflow: Charts

Purpose
- Generate charts with correct series queries, axes, and formatting.
- Enforce axis value format enums; only the documented Oracle APEX values are allowed (dateShort/dateMedium/dateLong/dateFull, timeShort/timeMedium/timeLong/timeFull, datetimeShort/datetimeMedium/datetimeLong/datetimeFull, decimal/currency/percent). `format: text` must never be emitted.

Required inputs
- Chart type, series query, axes/labels, formatting.

Clarify — progressive prompts
- Do any chart regions, related buttons, or items require a server-side condition? (Answer "none" to skip.)
- If yes, capture component scope (region, button, item, dynamic action, or process) and identifier.
- Provide the desired condition type or business rule; valid types are listed in references/policies/memory-bank/20-data/apex.logic.md.
- Gather required attributes for that type (item, value/list, request value, plsqlExpression, sqlQuery, etc.). Missing answers block the workflow.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/30-pages/apex.chart-page.md
- references/policies/memory-bank/20-data/apex.sql.md

Composition reference
- references/policies/memory-bank/40-components/apex.templates.md for shared template and layout defaults.

References
- references/policies/governance/00-governance.md
- assets/rules-mapping.json

Completion
- On user approval, collect ``db_connection_name`, `app_path`, and `application_id` (if not already set), run `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`, then route to `references/ops/runtime-gates/01-direct-sqlcl-import.md`.
