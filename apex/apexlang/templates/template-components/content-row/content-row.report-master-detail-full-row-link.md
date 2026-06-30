---
templateId: content-row.report-master-detail-full-row-link
componentType: templateComponent
imports:
  - content-row.common
version: 1.0
description: Report-mode Content Row master-detail selector with a same-page full-row action.
---

# Purpose

Render a parent Content Row list that drives child regions by updating a same-page hidden context item from the selected row primary key and refreshing dependent child regions without reloading the page.

# Output Template
```apx
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/contentRow
    appearance {
        template: @/standard
        templateOptions: #DEFAULT#
    }
    componentAppearance { display: report }
    settings {
        overline: &{{settings.overlineColumn}}.
        title: &{{settings.titleColumn}}.
        description: &{{settings.descriptionColumn}}.
        miscellaneous: &{{settings.miscellaneousColumn}}.
    }

    column {{pkColumnStaticId}} (
        source {
            databaseColumn: {{pkColumnName}}
            primaryKey: true
        }
    )

    action select-row (
        position: fullRowLink
        layout {
            sequence: 10
        }
        behavior {
            target: {
                page: {{currentPageId}}
                items: {
                    {{contextItemName}}: &{{pkColumnName}}.
                }
            }
        }
    )
)
```

# Conditional Rendering Rules
- Use this scenario when a parent row selects context for one or more child regions on the same page.
- Use `appearance.template: @/standard` for the visible master/list region. Do not use `@/blank-with-attributes`; reserve blank shells for structural containers and dashboard KPI strips.
- The target item must be a hidden same-page item such as `P3_ORDER_ID`.
- Do not implement the primary row selection with `redirectUrl`, `targetUrl`, or `f?p=` same-page reloads.
- Add dynamic-action/declarative refresh behavior so each child region depending on the context item refreshes after the parent row selection changes the item.
- Content Row settings backed by query columns must use `&COLUMN_NAME.` substitution syntax.
- Do not render a visible select list for the same parent context unless the prompt explicitly requests manual selection.
- Do not add `template` to a `fullRowLink` action; reserve `template: button|menu` for `primaryActions`.

# Validation Checklist
- Parent row PK column is present and marked as primary key.
- Settings values such as overline/title/description/miscellaneous reference projected columns with `&COLUMN_NAME.` syntax.
- `fullRowLink` action sets the hidden parent context item with `&COLUMN.` substitution.
- Child reports that reference the hidden context item list it in `source.pageItemsToSubmit`.
- Child reports are refreshed by parent-selection dynamic-action/declarative behavior.
