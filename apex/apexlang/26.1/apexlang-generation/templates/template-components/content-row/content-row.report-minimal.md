---
templateId: content-row.report-minimal
componentType: templateComponent
imports:
  - content-row.common
version: 1.0
description: Minimal report-mode Content Row example with explicit columns.
---

# Purpose
Render a report-style Content Row list with minimal settings and PK-backed explicit columns.

# Output Template
```apx
region {{regionStaticId}} (
    type: themeTemplateComponent/contentRow
    componentAppearance { display: report }
    settings { title: &{{settings.titleColumn}}. }
    column {{pkColumnStaticId}} (
        source { databaseColumn: {{pkColumnName}} primaryKey: true }
    )
)
```

# Conditional Rendering Rules
- Keep `display: report`.
- Include explicit columns with `databaseColumn` mappings.

# Validation Checklist
- At least one PK-backed column is present.
- `settings.title` uses `&COLUMN_NAME.` syntax and maps to a projected query/column alias.
