---
templateId: badge.report-minimal
componentType: templateComponent
imports:
  - badge._common.md
version: 1.0
description: Minimal informational report-mode Badge with explicit source columns.
---

# Purpose

Render one or more informational Badges without navigation.

# Output Template

```apexlang
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/badge
    componentAppearance {
        display: report
    }
    source {
        location: localDatabase
        type: sqlQuery
        sqlQuery: ```
{{source.sqlQuery}}
```
    }
    settings {
        label: {{settings.label}}
        value: {{settings.valueColumn}}
        {{#if settings.stateColumn}}
        state: {{settings.stateColumn}}
        {{/if}}
    }
    column {{valueColumnId}} (
        layout {
            sequence: 10
        }
        source {
            type: databaseColumn
            databaseColumn: {{valueColumnName}}
            dataType: varchar2
            primaryKey: false
        }
    )
    {{#if settings.stateColumn}}
    column {{stateColumnId}} (
        layout {
            sequence: 20
        }
        source {
            type: databaseColumn
            databaseColumn: {{stateColumnName}}
            dataType: varchar2
            primaryKey: false
        }
    )
    {{/if}}
)
```

# Conditional Rendering Rules

- Omit the state setting and state column when no semantic state is required.
- The `{{#if settings.stateColumn}}` blocks are conditional template fragments: render their contents only when semantic state is explicitly requested. They retain the exact state setting and child-column contract while omitting both when state is unspecified.
- Add one child column for every additional projected field.
- Add top-level deterministic `orderBy` when multiple rows are returned.

# Validation Checklist

- Label and value are present.
- Value/state mappings resolve to projected aliases.
- No action is emitted.
- State output is allowlisted when used.
