# Workflow: Interactive Report

Purpose
- Build an Interactive Report with validated SQL and consistent column configuration.

Required inputs
- Source table/view(s), page number, optional edit form link target.
- If invoked from calendar `viewEditLink`, require the page item that will hold the calendar primary key and filter the report SQL with that item.

Clarify — progressive prompts
- Are any report components, buttons, or related items expected to use a server-side condition? (Answer "none" to skip.)
- If yes, note the component scope (region, button, item, dynamic action, or process) and identifier.
- Provide the desired condition type or business rule; the canonical list resides in references/policies/memory-bank/20-data/apex.logic.md.
- Gather required attributes per type (item, value/list, request value, plsqlExpression, sqlQuery, etc.). Missing answers block the workflow.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/30-pages/apex.interactive-report.md
- references/policies/memory-bank/20-data/apex.sql.md
- When the Interactive Report includes user-entered text filters, generate `LOWER()`-normalized predicates for `=` / `!=` / `LIKE`.
- Interactive Report column links must keep the column `type: plainText` and use a column-level `link { target: ... linkText: ... }`; never emit Classic Report-only `type: link`.

Valid Interactive Report column link example:

```apexlang
column DNAME (
  type: plainText
  link {
    target: {
      page: 4
      items: {
        P4_DNAME: #DNAME#
      }
      clearCache: 4
    }
    linkText: #DNAME#
  }
)
```

Options
- 40-components/apex.items.md (if report links to a form)
- 20-data/apex.logic.md (DA refresh or server-side logic)
- If invoked from calendar `viewEditLink`, use a dedicated page item for the calendar PK and bind it in `source.sqlQuery`.

Templates
- templates/page-examples/interactive-report-page/interactive-report-page._index.md

References
- references/policies/governance/00-governance.md
- assets/rules-mapping.json

Completion
- After Revision, confirm or prompt for ``db_connection_name`, `app_path`, and `application_id`, run `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`, then invoke `references/ops/runtime-gates/01-direct-sqlcl-import.md`.
- Fail the workflow if a requested server-side condition is not tied to an accepted catalog type or lacks required attributes.
