# Workflow: Calendar Link Targets

Purpose
- Resolve `settings.createLink` and `settings.viewEditLink` for calendar regions without inferring downstream page targets.

Required inputs
- Calendar source table/view and primary key column.
- Whether `createLink`, `viewEditLink`, or both are in scope.
- For `createLink`, whether to use an existing form page or create a new same-table modal form page.
- For `viewEditLink`, whether to use an existing report page or create a new report page.
- For a new `viewEditLink` target, the chosen report type: Interactive Report or Classic Report.

Clarify — progressive prompts
- For `createLink`: “Do you want to use an existing form page, or should I create a new form page on the same table?”
- If existing form page: ask for the target page identifier and target item mapping.
- If new form page: gather the page number and any item mapping needed from the calendar.
- For `viewEditLink`: “Do you want to use an existing report page, or should I create a new report page?”
- If existing report page: ask for the target page identifier and the page item that receives the calendar primary key.
- If new report page: “Should the new report page be an Interactive Report or a Classic Report?”
- For any new report page: gather the page number, the PK-holding page item, and the filter contract for the report SQL.

Stop conditions
- If the existing-vs-new decision is unresolved after the single clarification round, stop with `Missing Inputs`.
- If a new report page is requested and the report type is not chosen, stop with `Missing Inputs`.
- If a report target lacks the PK item/filter contract, stop with `Missing Inputs`.

Downstream workflows
- New form page from `createLink`:
  - `references/domains/page-components/regions/form/workflow-modal-crud-form.md`
- New Interactive Report page from `viewEditLink`:
  - `references/domains/page-components/regions/interactive-report/workflow-interactive-report.md`
- New Classic Report page from `viewEditLink`:
  - `references/policies/memory-bank/30-pages/apex.classic-report.md`
  - `templates/page-examples/classic-report-page/classic-report-page._index.md`

References
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/memory-bank/30-pages/apex.calendar.md`
- `templates/region-components/calendar/calendar._common.md`
