---
templateId: metric-card.report-minimal
componentType: templateComponent
imports:
  - metric-card.common
version: 1.0
description: Minimal report-mode Metric Card with source-backed title and metric values.
---

# Purpose

Render one or more Metric Cards from a normalized report source using native title, metric, and meta attributes.

# Output Template

````apx
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/metricCard
    source {
        location: localDatabase
        type: sqlQuery
        sqlQuery:
            ```sql
            {{source.sqlQuery}}
            ```
    }
    layout {
        sequence: {{layout.sequence}}
        slot: body
    }
    appearance {
        template: @/blank-with-attributes
        templateOptions: #DEFAULT#
    }
    componentAppearance {
        display: report
    }
    settings {
        title: &{{settings.titleColumn}}.
        metric: &{{settings.metricColumn}}.
        meta: &{{settings.metaColumn}}.
        layout: {{settings.layout}}
    }
    column {{settings.titleColumn}} (
        layout {
            sequence: 10
        }
        appearance {
            group: false
        }
        source {
            databaseColumn: {{settings.titleColumn}}
            dataType: varchar2
        }
    )
    column {{settings.metricColumn}} (
        layout {
            sequence: 20
        }
        appearance {
            group: false
        }
        source {
            databaseColumn: {{settings.metricColumn}}
            dataType: {{metricColumn.dataType}}
        }
    )
    column {{settings.metaColumn}} (
        layout {
            sequence: 30
        }
        appearance {
            group: false
        }
        source {
            databaseColumn: {{settings.metaColumn}}
            dataType: varchar2
        }
    )
)
````

# Conditional Rendering Rules

- `settings.metric` is required.
- Omit `settings.title`, `settings.meta`, and their columns when the design does not need them.
- Use `&COLUMN.` substitution for query-backed title, metric, and meta text.
- Use one source row per card. Normalize independent metrics into the same aliases, typically with `UNION ALL`.
- Replace the SQL metavariable only after every referenced database object and column has authoritative evidence. A literal `dual` smoke test is valid only for explicit test fixtures.

# Validation Checklist

- Every projected alias has a child column.
- Metric data type matches the delivered projection.
- Layout uses a supported Metric Card layout token.
- SQL returns raw values and contains no presentation HTML.
