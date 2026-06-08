# Workflow: CRUD Form Region

Purpose
- Scaffold a CRUD form using the standard template and minimal rule set for modal, drawer, or normal embedded form targets.

Required inputs
- Target table/view, primary key, page number, button names (Save/Create/Delete).
- Form presentation when it is not the default drawer end/right: standard modal dialog, drawer start/top/bottom, wizard modal dialog, popout-style standard modal dialog, or normal non-modal detail page.
- If invoked from calendar `createLink`, keep the new modal form on the same base table/view as the calendar source and gather any explicit calendar-to-form item mappings.
- Every generated form region must include PK source item mappings with `primaryKey: true`; this is mandatory for normal, modal, and drawer pages.

Clarify — progressive prompts
- Do any new or updated components in this modal form require a server-side condition? (Answer "none" to skip.)
- If yes, specify the component scope (button, region, item, dynamic action, or process) and identifier.
- Provide the desired condition type or business rule. Valid types are listed in references/policies/memory-bank/20-data/apex.logic.md under "Server-Side Condition Catalog".
- Gather required attributes for the chosen type (for example, item name, comparison value/list, request value, plsqlExpression, sqlQuery). Missing answers block the workflow.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md (+ 10-global/apex.acronyms.md as needed)
- references/policies/memory-bank/30-pages/apex.form.md
- references/policies/memory-bank/40-components/apex.items.md (if item specifics/LOVs)
- references/policies/memory-bank/20-data/apex.sql.md (query standards, LOV SQL)
- references/policies/memory-bank/20-data/apex.logic.md (processes, validations, DAs)

Clarify
- ARP vs packaged PL/SQL for DML.
- Presentation only when the user or spec asks for something other than the default: drawer end/right is the default for report row edit/create flows; standard modal dialog, drawer start/top/bottom, wizard modal, popout-style dialog, and normal detail page require explicit requirements or a page design reason.
- LOV sources (static vs SQL) and FK behavior.
- If invoked from calendar `createLink`, confirm the target item that receives the selected calendar value(s) such as start date.
- Keep create-link selected-date prefill separate from drag/drop persistence. `&APEX$NEW_START_DATE.` is allowed for `createLink.items` date prefills, while `:APEX$NEW_START_DATE` / `:APEX$NEW_END_DATE` remain drag/drop persistence bind variables.

Templates
- templates/page-examples/form-page/form-page._index.md
- templates/page-layout-templates/modal-dialog/modal-dialog._index.md
- templates/page-layout-templates/drawer/drawer._index.md (only when drawer is explicitly selected)
- templates/page-layout-templates/wizard-modal-dialog/wizard-modal-dialog._index.md (only for wizard-style flows)

References
- references/policies/governance/00-governance.md
- assets/rules-mapping.json

Completion
- After Revision, confirm or prompt for ``db_connection_name`, `app_path`, and `application_id`, run `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`, then invoke `references/ops/runtime-gates/01-direct-sqlcl-import.md`.
- Fail the workflow if a requested server-side condition is not mapped to an accepted catalog type or lacks required attributes.
- Fail the workflow if any generated form region has no source-mapped PK item with `primaryKey: true`.
