---
templateId: region.interactive-report.common
componentType: region
version: 1.0
description: Shared contract for interactive report regions.
---

# Purpose

Standardize the variable contract, guardrails, and template skeleton for interactive report scenarios.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/30-pages/apex.interactive-report.md` before drafting interactive reports.
2. Validate SQL against the target schema or mark Validation Pending.
3. Ensure column definitions align with the SQL projection and include comments.
4. For NL2IR configurations, follow `references/policies/memory-bank/00-guard/ai.guard.md` and require annotation-scan metadata lookup with descriptive-annotation fallback before comments.
5. Use `interactive-report._columns._common.md` as the canonical column contract.
6. Emit explicit `column (...)` definitions for every SQL projection before finals; hidden technical columns still need structural headings.
7. If `source.sqlQuery` references same-page items such as `:P3_ORDER_ID`, list those items in `source.pageItemsToSubmit`.
8. For Interactive Report `source.sqlQuery` that uses page-item-driven text filters, emit `LOWER()` on both sides of `=` / `!=` / `LIKE`.
9. If the report adds navigation, ask which mode is required every time: same application page, another application page, or URL redirect.
10. When the chosen mode is same application page and the DSL supports it, emit a declarative page target instead of a URL string.

---

# Variable Contract


| Name                                 | Required    | Type      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------ | ----------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| regionStaticId                       | yes         | string    | Identifier used after the `region` keyword.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| name                                 | yes         | string    | Builder display name.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| type                                 | yes         | enum      | Always `interactiveReport`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| source.location                      | yes         | enum      | `localDatabase`, `restSource`, `sampleData`, etc.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| source.type                          | conditional | enum      | `sqlQuery`, `table`, or omitted for REST.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| source.sqlQuery                      | conditional | sql       | Required for `sqlQuery`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| source.tableName                     | conditional | string    | Required for table-sourced IRs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| source.restSource                    | conditional | string    | Required when `location: restSource`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| source.pageItemsToSubmit             | optional    | list      | Use for REST parameters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| layout.sequence                      | yes         | number    | Region order in the page slot.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| layout.slot                          | yes         | enum      | Slot the region occupies (e.g., `BODY`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| appearance.template                  | optional    | string    | Report template (e.g., `@/standard`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| appearance.templateOptions           | optional    | array     | Additional modifiers (`#DEFAULT#` default); use the documented accepted values in `interactive-report._template_options.md`, keep `#DEFAULT#` standalone, and keep documented composites atomic.                                                                                                                                                                                                                                                                                                                                                                                                 |
| componentAppearance.showNullValuesAs | optional    | string    | Null-display value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| pagination.type                      | optional    | enum      | Pagination strategy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| performance.maxRowsToProcess         | optional    | number    | Max rows to process.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| messages.whenNoDataFound             | optional    | string    | Custom "no data" message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| messages.whenMoreDataFound           | optional    | string    | Max row message.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| link                                 | optional    | object    | Region-level link configuration; use when needed to link to another page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| link.linkColumn                      | conditional | enum      | Compiler-backed IR link mode. Use `customTarget` for same-app/page navigation. Other accepted runtime values include `exclude` and `singleRowView`; do not put a report column alias here.                                                                                                                                                                                                                                                                                                                                                                                                       |
| link.target.page                     | conditional | string    | If a link is needed, set to the page ID of the target page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| link.target.items                    | conditional | object    | If a link is needed, set page-item/value pairs for the destination page. Use `#COLUMN_ALIAS#` for current report-row column values, `&ITEM.` for page/app/session substitution values, or literals where appropriate. Example: `items: { P1_ID: #ID# P1_STATUS: &P1_STATUS. P1_VAL: 100 }`                                                                                                                                                                                                                                                                                                |
| link.target.clearCache               | conditional | number    | List of comma-separated page numbers; used to clear the session cache of each page                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| link.target.action                   | conditional | string    | Use when performing an additional action on the page. Valid values are:- `clearRegions` : Completely tears down all session settings and customizations (like filters, aggregates, and highlights), reverting the region to the absolute default state.- `resetRegions` : Reverts the region back to its last saved state (e.g., the default report settings) while often preserving pagination or specific saved report metadata.- `resetPagination` : resets the pagination for all reports on the target pageIn most cases, this will be either omitted entirely or set to `resetPagination` |
| link.target.request                  | conditional | string    | Context of actions typically refers to the **Request Value** sent during a page submission to trigger specific server-side processes; often used to simulate pressing a button                                                                                                                                                                                                                                                                                                                                                                                                                     |
| link.linkIcon                        | conditional | string    | Used to act as what the user will click to activate the link. Default to `<span role="img" aria-label="Edit" class="fa fa-edit" title="Edit"></span>`                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| link.linkAttributes                  | conditional | string    | Enter additional column link attributes to be included in the `<a href=...>` tag, including link target, classes or styles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| link.authorizationScheme             | conditional | string    | Enter the Authorization Scheme that a user need to have in order to see the link rendered on the report. Should be prefixed with `@`                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| columns                              | conditional | list      | One or more column blocks following `interactive-report._columns._common.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| savedReport.*                        | optional    | object    | Saved report defaults.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| genAI.*                              | optional    | object    | NL2IR settings (scan annotations first, then comments).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| serverSideCondition.*                | optional    | condition | Server-side gating of region visibility.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| security.authorizationScheme         | optional    | string    | Authorization scheme alias.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |


---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: interactiveReport
  source {
    location: {{source.location}}
    type: {{source.type}}
    sqlQuery:
        ```sql
        {{source.sqlQuery}}
        ```
    tableName: {{source.tableName}}
    restSource: {{source.restSource}}
    pageItemsToSubmit: {{source.pageItemsToSubmit}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: {{appearance.templateOptions}}
  }
  componentAppearance {
    showNullValuesAs: {{componentAppearance.showNullValuesAs}}
  }
  link {
      linkColumn: {{link.linkColumn}}
      target: {
          page: {{link.target.page}}
          items: {
              {{link.target.items}}
          }
          clearCache: {{link.target.clearCache}}
          action: {{link.target.action}}
          request: {{link.target.request}}
      }
      linkIcon: {{link.linkIcon}}
      linkAttributes: {{link.linkAttributes}}
      authorizationScheme: {{link.authorizationScheme}}
  }
  pagination {
    type: {{pagination.type}}
  }
  performance {
    maxRowsToProcess: {{performance.maxRowsToProcess}}
  }
  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
    whenMoreDataFound: {{messages.whenMoreDataFound}}
  }
  genAI {
    naturalLanguageSupport: {{genAI.naturalLanguageSupport}}
    reportContext: {{genAI.reportContext}}
  }
  serverSideCondition {
    type: {{serverSideCondition.type}}
    item: {{serverSideCondition.item}}
    {{serverSideCondition.comparisonAttribute}}: {{serverSideCondition.comparisonValue}}
  }
  {{columns}}
  savedReport {{savedReport.name}} (
    visibility: {{savedReport.visibility}}
    name: {{savedReport.displayName}}
    view {
      rowsPerPage: {{savedReport.rowsPerPage}}
    }
  )
)
```

---

# Mandatory Rendering Rules

- Expand `{{columns}}` using `interactive-report._columns._common.md`.

---

# Conditional Rendering Rules

- Remove optional blocks (`link`, `pagination`, `performance`, `messages`, `genAI`, `serverSideCondition`) when not required.
- Use server-side conditions for feature flags, request-based visibility, or authorization policies.
- For item colon-list membership conditions, render `comparisonAttribute` as `list`; keep `value` for other comparison types.
- When a report-level link is needed, add the `link` section. For page navigation, set `link.linkColumn: customTarget` and then provide the declarative `target: { ... }` object. Do not put a report column alias such as `ORDER_ID` or `PRODUCT_ID` into `link.linkColumn`.
- When the report source filters on same-page context items, emit `source.pageItemsToSubmit` with the exact item tokens used in the SQL binds.

---

# Guardrails

- Keep templateOptions as `#DEFAULT#` unless a documented `static_id` in `interactive-report._template_options.md` is required.
- Never concatenate `#DEFAULT#` with another modifier or substitute the emitted CSS class string for the documented accepted value.
- Use declarative same-app page targets when supported; use URL patterns only for explicit URL mode or when the component contract genuinely requires a URL string.
- Do not finalize an Interactive Report with projected SQL columns missing from the `column (...)` list.
- Do not leave `source.pageItemsToSubmit` empty when the report SQL depends on same-page page-item bind variables.
- For NL2IR, derive report and column context from annotations first, using descriptive annotations before comments as fallback (no inference).
- Validate SQL with SQLcl when possible; otherwise mark "Validation Pending".
- The `LOWER()` normalization rule for page-item-driven text predicates is specific to Interactive Reports and does not apply to Classic Report or Interactive Grid guidance.
