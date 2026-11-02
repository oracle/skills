# Component Registry Excerpts — Regions

| Keyword | Workflow / Component | Required Inputs |
|---------|----------------------|-----------------|
| `interactive-report` | `interactive-report` | SQL/table, columns |
| `dashboard` | `dashboard` | KPI queries, region sequence |
| `chart` | `chart-*` variants (area, bar, line, etc.) | Dataset SQL, measure/dimension columns |
| `calendar` | `calendar` + `calendar-link-targets` | Date column, primary key column, create/view link target decisions |
| `map` | `map` | Lat/Long or geocode columns |
| `form` | `modal-crud-form` | Table, PK, CRUD buttons |
| `dynamic-action` | `dynamic-action-*` | Trigger selectors, refresh targets |
| `da-batch-apply` | `dynamic-action-batch` | Archetype, target pages |
| `button-actions-batch` | `button-actions-batch` | Button names, target pages |
| `computation-plsql-batch` | `computation-batch` | Computation type, logic |

Refer to `components.registry.json` for synonyms and template references.
