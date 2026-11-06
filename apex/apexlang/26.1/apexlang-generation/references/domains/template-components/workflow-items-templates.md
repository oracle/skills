# Workflow: Items & Templates

Purpose
- Configure items and templates with validated attributes and LOVs.

Required inputs
- Item types, validation needs, LOV sources, template targets.

Clarify — progressive prompts
- Do any items or templates require a server-side condition? (Answer "none" to skip.)
- If yes, identify the component scope (item, button, region, process, or dynamic action) and name.
- Provide the desired condition type or business rule. Acceptable types are listed in references/policies/memory-bank/20-data/apex.logic.md.
- Collect the required attributes for that type (item reference, comparison value/list, request value, plsqlExpression, sqlQuery, etc.). Missing answers block the workflow.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/40-components/apex.items.md
- references/policies/memory-bank/40-components/apex.templates.md
- references/policies/memory-bank/20-data/apex.sql.md (for LOV SQL/format masks)

Policy
- Never invent attribute/value pairs; follow templates and rule examples.
- For content-row page or region generation, use `content-row.report-minimal.md` as the default starting scenario.
- Only layer `report-avatar-badge`, `report-link-positions`, `report-primary-actions-menu`, `report-grouping-selection`, or `report-appearance-variants` when those capabilities are explicitly requested.
- For Content Row avatar rendering, use `settings.displayAvatar`; keep `plugin-avatar` for avatar configuration only, including `description` and `size` when needed.
- For Content Row badge rendering, use `settings.displayBadge`; keep `plugin-badge` for badge configuration only.
- When the prompt asks for badge visual treatment, use `plugin-badge.style`, `plugin-badge.shape`, `plugin-badge.icon`, and `plugin-badge.position` for supported values such as `subtle`, `rounded`, `fa-city`, and `end`.
- Ensure `primaryActions` examples use valid `action ... (` components closed with `)`.

References
- references/policies/governance/00-governance.md
- assets/rules-mapping.json

Completion
- After Revision, gather ``db_connection_name`, `app_path`, and `application_id` if missing, run `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`, then route to `references/ops/runtime-gates/01-direct-sqlcl-import.md`.
- Fail the workflow if a requested server-side condition does not resolve to a catalog type or lacks required attributes.
