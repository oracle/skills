---
templateId: content-row.report-grouping-selection
componentType: templateComponent
imports:
  - content-row.common
version: 1.0
description: Report-mode grouping, native focus/single/multiple row selection, pagination, and entity titles.
---

# Purpose
Provide the canonical report-mode pattern for native focus-only, single-row, and multiple-row selection, including page-item-backed selection state when persistence is required.

# Output Template
```apx
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/contentRow
    source {
        location: {{source.location}}
        sampleData: {{source.sampleData}}
    }
    componentAppearance {
        display: report
    }
    settings {
        overline: {{settings.overlineLiteral}}
        title: &{{settings.titleColumn}}.
        description: &{{settings.descriptionColumn}}.
        miscellaneous: &{{settings.miscellaneousColumn}}.
        displayAvatar: {{settings.displayAvatar}}
        displayBadge: {{settings.displayBadge}}
    }
    plugin-avatar {
        type: {{pluginAvatar.type}}
        initials: {{pluginAvatar.initialsColumn}}
    }
    plugin-badge {
        label: {{pluginBadge.label}}
        value: {{pluginBadge.valueColumn}}
    }
    plugin-appearance {
        stackOnMobile: {{pluginAppearance.stackOnMobile}}
    }
    rowSelection {
        type: singleSelection
        currentSelectionPageItem: {{rowSelection.currentSelectionPageItem}}
        selectAllPageItem: {{rowSelection.selectAllPageItem}}
    }
    pagination {
        type: page
        entitiesPerPage: {{pagination.entitiesPerPage}}
    }
    column {{pkColumnStaticId}} (
        source {
            databaseColumn: {{pkColumnName}}
            dataType: {{pkColumnDataType}}
            primaryKey: true
        }
    )
)

pageItem {{rowSelection.currentSelectionPageItem}} (
    type: hidden
    layout {
        sequence: {{selectionItem.layout.sequence}}
        slot: regionBody
    }
)

pageItem {{rowSelection.selectAllPageItem}} (
    type: checkbox
    label {
        label: Select All
        alignment: left
    }
    layout {
        sequence: {{selectAllItem.layout.sequence}}
        region: @{{toolbarRegionStaticId}}
        slot: regionBody
        alignment: left
    }
)
```

# Conditional Rendering Rules
- Keep grouping, native row selection, and pagination in report mode only.
- When any child column uses grouping, emit top-level `orderBy` and sort by every grouped column first, in grouping order, before any remaining tie-breakers.
- When `pagination {}` is emitted, use `type: page` or `type: scroll`; page-size examples in this file use `type: page`.
- Use `rowSelection.type: focusOnly` when the user needs row focus behavior without storing selected-row state.
- Use `rowSelection.type: singleSelection` with `currentSelectionPageItem` when the user needs Content Row single-row selection.
- Use `rowSelection.type: multipleSelection` with both `currentSelectionPageItem` and `selectAllPageItem` when the user needs Content Row multi-row selection.
- Create the referenced same-page hidden item by default; it stores the selected row value(s) for refreshes, conditions, dynamic actions, or child regions.
- For `multipleSelection`, create the referenced select-all page item as a checkbox, typically in a toolbar/static-content container above the Content Row region.
- The Content Row must include a primary-key column so native selection has stable selected value(s).
- Literal display settings such as `overline: Employee` are allowed; query-column-backed display settings must use `&COLUMN_NAME.` syntax.
- Use `fullRowLink` actions only for navigation or explicit action-driven behavior. Native `rowSelection.currentSelectionPageItem` is not a substitute for master-detail `behavior.target.items`; when the parent row filters child regions, use `content-row.report-master-detail-full-row-link.md`.

# Focus-Only Example
```apx
region employees-focus-only (
    name: Employees (Focus Only)
    type: themeTemplateComponent/contentRow
    source {
        location: sampleData
        sampleData: employees
    }
    componentAppearance { display: report }
    settings {
        overline: Employee
        title: &NAME.
        description: &JOB.
        miscellaneous: &SALARY.
    }
    rowSelection {
        type: focusOnly
    }
    column ID (
        source {
            databaseColumn: ID
            dataType: number
            primaryKey: true
        }
    )
)
```

# Single-Selection Example
```apx
region employees-single-select (
    name: Employees (Single Select)
    type: themeTemplateComponent/contentRow
    source {
        location: sampleData
        sampleData: employees
    }
    componentAppearance { display: report }
    settings {
        overline: Employee
        title: &NAME.
        description: &JOB.
        miscellaneous: &SALARY.
        displayAvatar: true
        displayBadge: true
    }
    plugin-avatar {
        type: initials
        initials: INITIALS
    }
    plugin-badge {
        label: ID
        value: ID
    }
    plugin-appearance {
        stackOnMobile: true
    }
    rowSelection {
        type: singleSelection
        currentSelectionPageItem: P2_SELECTED_EMPLOYEE
    }
    pagination {
        type: page
        entitiesPerPage: 50
    }
    column ID (
        source {
            databaseColumn: ID
            dataType: number
            primaryKey: true
        }
    )
    column NAME (
        source { databaseColumn: NAME dataType: varchar2 }
    )
    column JOB (
        source { databaseColumn: JOB dataType: varchar2 }
    )
    column SALARY (
        source { databaseColumn: SALARY dataType: number }
    )
    column INITIALS (
        source { databaseColumn: INITIALS dataType: varchar2 }
    )
)

pageItem P2_SELECTED_EMPLOYEE (
    type: hidden
    layout {
        sequence: 10
        slot: regionBody
    }
)
```


# Multiple-Selection Example
```apx
region toolbar-container (
    name: Toolbar Container
    type: staticContent
    layout {
        sequence: 10
        slot: regionBody
    }
    appearance {
        template: @/blank-with-attributes
        templateOptions: #DEFAULT#
    }
)

region employees-multiple-select (
    name: Employees (Multiple Select)
    type: themeTemplateComponent/contentRow
    source {
        location: sampleData
        sampleData: employees
    }
    layout {
        sequence: 30
        slot: regionBody
    }
    componentAppearance { display: report }
    settings {
        overline: Employee
        title: &NAME.
        description: &JOB.
        miscellaneous: &SALARY.
        displayAvatar: true
        displayBadge: true
    }
    plugin-avatar {
        type: initials
        initials: INITIALS
    }
    plugin-badge {
        label: ID
        value: ID
    }
    plugin-appearance {
        stackOnMobile: true
    }
    rowSelection {
        type: multipleSelection
        currentSelectionPageItem: P2_SELECTED_EMPLOYEE
        selectAllPageItem: P2_SELECT_ALL
    }
    pagination {
        type: page
        entitiesPerPage: 50
    }
    column ID (
        source {
            databaseColumn: ID
            dataType: number
            primaryKey: true
        }
    )
    column NAME (
        source { databaseColumn: NAME dataType: varchar2 }
    )
    column JOB (
        source { databaseColumn: JOB dataType: varchar2 }
    )
    column SALARY (
        source { databaseColumn: SALARY dataType: number }
    )
    column INITIALS (
        source { databaseColumn: INITIALS dataType: varchar2 }
    )
)

pageItem P2_SELECTED_EMPLOYEE (
    type: hidden
    layout {
        sequence: 20
        slot: regionBody
    }
)

pageItem P2_SELECT_ALL (
    type: checkbox
    label {
        label: Select All
        alignment: left
    }
    layout {
        sequence: 10
        region: @toolbar-container
        slot: regionBody
        alignment: left
    }
    appearance {
        template: @/optional-floating
        templateOptions: #DEFAULT#
    }
)
```

# Validation Checklist
- `rowSelection.type` is `focusOnly`, `singleSelection`, or `multipleSelection`.
- `focusOnly` does not include `currentSelectionPageItem` or `selectAllPageItem`.
- `singleSelection` and `multipleSelection` include `rowSelection.currentSelectionPageItem`, and that item references an existing same-page hidden item.
- The hidden item stores native selected row value(s) for dependent refreshes, conditions, or dynamic actions; it does not replace the `fullRowLink` action required for master-detail child filtering.
- `multipleSelection` includes `rowSelection.selectAllPageItem`, and that page item exists as a same-page checkbox.
- A PK-backed Content Row column is present.
- When grouping is used, top-level `orderBy` sorts by the grouped column set first.
- Literal and column-backed settings use the correct syntax.
