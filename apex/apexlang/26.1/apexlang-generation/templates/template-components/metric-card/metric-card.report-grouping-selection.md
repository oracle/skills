---
templateId: metric-card.report-grouping-selection
componentType: templateComponent
imports:
  - metric-card.common
  - metric-card.report-minimal
version: 1.0
description: Report-mode Metric Card with deterministic grouping and optional native row selection.
---

# Purpose

Generate grouped Metric Cards or selection-enabled Metric Cards with stable row identity and correctly typed same-page items.

# Grouped Output Template

```apx
region {{regionStaticId}} (
    type: themeTemplateComponent/metricCard
    orderBy {
        type: staticValue
        orderByClause: {{groupColumn}} asc, {{primaryKeyColumn}} asc
    }
    componentAppearance {
        display: report
    }
    settings {
        title: &{{settings.titleColumn}}.
        metric: &{{settings.metricColumn}}.
    }
    plugin-grouping {
        groupTitle: {{grouping.title}}
        groupIcon: {{grouping.icon}}
    }
    column {{groupColumn}} (
        layout {
            sequence: 10
        }
        appearance {
            group: true
        }
        source {
            databaseColumn: {{groupColumn}}
            dataType: varchar2
        }
    )
)
```

# Selection Templates

```apx
rowSelection {
    type: focusOnly
}
```

```apx
rowSelection {
    type: singleSelection
    currentSelectionPageItem: {{selection.currentItem}}
}

pageItem {{selection.currentItem}} (
    type: hidden
    layout {
        sequence: {{selection.currentItemSequence}}
        slot: regionBody
    }
    security {
        sessionStateProtection: unrestricted
    }
    comments {
        comments: Same-page dynamic-action ownership: native Metric Card selection updates this client-owned UI state after render, so checksum-based SSP would block the intended flow.
    }
)
```

```apx
rowSelection {
    type: multipleSelection
    currentSelectionPageItem: {{selection.currentItem}}
    selectAllPageItem: {{selection.selectAllItem}}
}

pageItem {{selection.currentItem}} (
    type: hidden
    layout {
        sequence: {{selection.currentItemSequence}}
        slot: regionBody
    }
    security {
        sessionStateProtection: unrestricted
    }
    comments {
        comments: Same-page dynamic-action ownership: native Metric Card selection updates this client-owned UI state after render, so checksum-based SSP would block the intended flow.
    }
)

pageItem {{selection.selectAllItem}} (
    type: checkbox
    label {
        label: Select All
        alignment: left
    }
    help {
        helpText: Select or clear all metric cards.
    }
    layout {
        sequence: {{selection.selectAllItemSequence}}
        region: @{{selection.toolbarRegion}}
        slot: regionBody
    }
)
```

# Conditional Rendering Rules

- Use grouping and selection only when requested; they are independent features.
- Grouping requires at least one child column with `appearance.group: true` and top-level static ordering beginning with every grouped column in declaration order. The `plugin-grouping` block is optional when no custom group title/icon is needed.
- `groupIcon` requires `groupTitle`.
- Every selection mode requires a child column with `source.primaryKey: true`.
- `focusOnly` emits no page-item bindings.
- `singleSelection` uses a same-page hidden current-selection item with documented `sessionStateProtection: unrestricted` and no select-all item.
- `multipleSelection` uses the same protected-by-classification hidden current-selection item plus a checkbox or switch select-all item.

# Validation Checklist

- Group columns lead deterministic ordering.
- Selection item names resolve to page items of the required types.
- Exactly one stable identity column is marked as the primary key for ordinary single-key sources.
