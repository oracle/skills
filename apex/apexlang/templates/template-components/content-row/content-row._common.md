---
templateId: content-row.common
componentType: templateComponent
version: 1.0
description: Shared canonical contract for Content Row template component generation.
---

# Purpose

Define the shared variable contract, guardrails, and output skeleton for Content Row template component templates.

---

# Generation Rules (MANDATORY)

1. Use `type: themeTemplateComponent/contentRow`.
2. Use `appearance.template: @/standard` for visible report-mode Content Row list/master regions unless a narrower, documented structural exception applies. Do not use `@/blank-with-attributes` for master/detail parent lists.
3. Use `componentAppearance.display: partial` or `report` only.
4. For `primaryActions`, allow only `template: button` or `template: menu`.
5. Use `databaseColumn` for column source mappings.
6. Keep link/action behavior explicit. Use a structured `behavior.target` for same-application page targets when supported; use `behavior.type` plus `behavior.targetUrl` for URL-style targets.
7. Use `settings.displayAvatar` to enable avatar rendering; do not place `displayAvatar` inside `plugin-avatar`.
8. Use `settings.displayBadge` to enable badge rendering; do not place `displayBadge` inside `plugin-badge`.
9. Use `plugin-badge.icon` only for badge icon configuration when the prompt explicitly requests an icon.
10. Use `plugin-badge.position` only for badge placement configuration when the prompt explicitly requests a start/end placement override.
11. Close component blocks declared with parentheses (for example `action ... (` or `column ... (`) using `)` after nested blocks.
12. Keep plugin attribute names and enumerated values aligned with `content-row._template_options.md`, `../avatar._template_options.md`, and `../badge._template_options.md`.
13. Content Row display settings that map to query columns must use `&COLUMN_NAME.` substitution syntax, for example `title: &ORDER_LABEL.`. Do not emit bare column aliases such as `title: ORDER_LABEL` for `overline`, `title`, `description`, or `miscellaneous`.
14. Native row selection uses `rowSelection` in report mode. Use `type: focusOnly` for focus behavior without persisted selection state, `type: singleSelection` with `currentSelectionPageItem` for one selected row, or `type: multipleSelection` with both `currentSelectionPageItem` and `selectAllPageItem` for multi-select. The current-selection item should normally be a same-page hidden item that stores selected row value(s); the select-all item should be a same-page checkbox. `rowSelection.currentSelectionPageItem` is native selection state only and does not satisfy master-detail drill-down or parent-child context setting.
15. SQL-backed Content Row regions must use top-level `orderBy {}` for deterministic ordering. Do not put `ORDER BY` inside `source.sqlQuery`.
16. Use `orderBy { type: staticValue orderByClause: ... }` by default. Use `orderBy { type: item ... }` only when an available same-page page item controls the sort.
17. When emitting `pagination {}` for report-mode Content Row, `pagination.type` is required and must be `page` or `scroll`. Do not reuse classic-report pagination enums such as `rowRangesXToYNoPagination`.
18. When `rowSelection` is emitted with any non-null mode, at least one immediate child `column (...)` must mark the row identity with `source.primaryKey: true`.
19. When any Content Row child column uses grouping, emit top-level `orderBy {}` and order by every grouped column first, in grouping order, before any secondary tie-breakers.
20. In report mode, explicit child `column (...)` metadata is required and should match the delivered region source projection by default.
21. Do not satisfy the compiler by adding only a minimal subset of child columns when the source projects more fields. By default, emit child `column (...)` blocks that match the region source columns in order.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Region static identifier. |
| name | yes | string | Region display name. |
| source.location | yes | enum | Data-source location. |
| orderBy.type | conditional | enum | Required for SQL-backed Content Row regions. Use `staticValue` or `item`. |
| orderBy.orderByClause | conditional | string | Required when `orderBy.type = staticValue`; omit the leading `ORDER BY` keyword. |
| orderBy.item.itemName | conditional | string | Required when `orderBy.type = item`; must reference an available same-page page item. |
| orderBy.item.orderBys | conditional | object | Required when `orderBy.type = item`; maps page item values to ORDER BY clauses. |
| componentAppearance.display | yes | enum | `partial` or `report`. |
| settings.overline | optional | string | Overline content mapping/value; use `&COLUMN_NAME.` when mapped to a query column. |
| settings.title | yes | string | Main row heading mapping/value; use `&COLUMN_NAME.` when mapped to a query column. |
| settings.description | optional | string | Description mapping/value; use `&COLUMN_NAME.` when mapped to a query column. |
| settings.miscellaneous | optional | string | Trailing metadata mapping/value; use `&COLUMN_NAME.` when mapped to a query column. |
| settings.displayAvatar | optional | boolean | Enables avatar rendering for the row. |
| settings.displayBadge | optional | boolean | Enables badge rendering for the row. |
| plugin-avatar.type | conditional | enum | Avatar type when avatar rendering is enabled. |
| plugin-avatar.icon | optional | string | Avatar icon mapping/value when `type` is `icon`. |
| plugin-avatar.initials | optional | string | Avatar initials mapping/value when `type` is `initials`. |
| plugin-avatar.description | optional | string | Accessible avatar description text. |
| plugin-avatar.shape | optional | enum | Optional avatar shape when supported by the template. |
| plugin-avatar.size | optional | enum | Optional avatar size when supported by the template. |
| plugin-avatar.cssClasses | optional | string | Optional avatar styling classes when supported by the template. |
| plugin-badge.label | conditional | string | Badge label text when badge rendering is enabled. |
| plugin-badge.value | conditional | string | Badge value mapping when badge rendering is enabled. |
| plugin-badge.state | optional | string | Badge state/style mapping when semantically meaningful. |
| plugin-badge.style | optional | enum | Optional badge visual style when supported by the template, for example `subtle`. |
| plugin-badge.shape | optional | enum | Optional badge shape when supported by the template, for example `rounded`. |
| plugin-badge.size | optional | enum | Optional badge size when supported by the template. |
| plugin-badge.icon | optional | string | Optional badge icon mapping/value when the prompt explicitly requests an icon. |
| plugin-badge.displayLabel | optional | enum | Optional badge display override when supported by the template, for example `true`. |
| plugin-badge.position | optional | enum | Optional badge placement override when supported by the template, for example `start` or `end`. |
| plugin-badge.columnWidth | optional | enum | Optional badge width control when supported by the template. |
| rowSelection.type | conditional | enum | Use `focusOnly`, `singleSelection`, or `multipleSelection` for native row selection in report mode. |
| rowSelection.currentSelectionPageItem | conditional | string | Same-page hidden item that stores native selected row value(s), for example `P2_SELECTED_EMPLOYEE`; not a substitute for master-detail `fullRowLink` context setting. |
| rowSelection.selectAllPageItem | conditional | string | Same-page checkbox item used by `multipleSelection` to toggle all rows, for example `P2_SELECT_ALL`. |
| pagination.type | conditional | enum | Required when `pagination {}` is emitted in report mode. Valid values are `page` and `scroll`. |
| pagination.entitiesPerPage | optional | number | Page size when `pagination.type: page` needs an explicit page length. |
| pagination.showTotalCount | optional | boolean | Optional total-count indicator when supported. |
| action.position | optional | enum | `avatarLink`, `titleLink`, `badgeLink`, `fullRowLink`, `primaryActions`. |
| action.template | conditional | enum | Required for `primaryActions`; `button` or `menu`. |
| action.behavior.target | conditional | object | Preferred for same-application page targets, especially master-detail `fullRowLink` actions that set same-page context items. |
| action.behavior.targetUrl | conditional | string | Required for redirect URL actions. |
| column.name | conditional | string | Required for report mode explicit columns. By default, emit one immediate child column per delivered source field in region-source order. |
| column.layout.sequence | conditional | number | Required for every Content Row child column. Emit as a multiline `layout { sequence: ... }` block. |
| column.source.databaseColumn | conditional | string | Required for report mode explicit columns. |
| column.source.dataType | conditional | string | Required for report mode explicit columns, for example `number`, `varchar2`, `date`, or `timestamp`. |
| column.source.primaryKey | optional | boolean | Emit `true` only on the row identity column. |

---

# Output Template – Full

```apx
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/contentRow
    source {
        type: sqlQuery
        sqlQuery:
            ```sql
            {{source.sqlQuery}}
            ```
    }
    orderBy {
        type: staticValue
        orderByClause: {{orderBy.orderByClause}}
    }
    componentAppearance {
        display: {{componentAppearance.display}}
    }
    settings {
        overline: &{{settings.overlineColumn}}.
        title: &{{settings.titleColumn}}.
        description: &{{settings.descriptionColumn}}.
        miscellaneous: &{{settings.miscellaneousColumn}}.
        displayAvatar: {{settings.displayAvatar}}
        displayBadge: {{settings.displayBadge}}
    }
    plugin-avatar {
        type: {{pluginAvatar.type}}
        icon: {{pluginAvatar.icon}}
        initials: {{pluginAvatar.initials}}
        description: {{pluginAvatar.description}}
        shape: {{pluginAvatar.shape}}
        size: {{pluginAvatar.size}}
        cssClasses: {{pluginAvatar.cssClasses}}
    }
    plugin-badge {
        label: {{pluginBadge.label}}
        value: {{pluginBadge.value}}
        state: {{pluginBadge.state}}
        displayLabel: {{pluginBadge.displayLabel}}
        style: {{pluginBadge.style}}
        shape: {{pluginBadge.shape}}
        size: {{pluginBadge.size}}
        icon: {{pluginBadge.icon}}
        position: {{pluginBadge.position}}
        columnWidth: {{pluginBadge.columnWidth}}
    }
    rowSelection {
        type: {{rowSelection.type}}
        currentSelectionPageItem: {{rowSelection.currentSelectionPageItem}}
        selectAllPageItem: {{rowSelection.selectAllPageItem}}
    }
    pagination {
        type: {{pagination.type}}
        entitiesPerPage: {{pagination.entitiesPerPage}}
        showTotalCount: {{pagination.showTotalCount}}
    }
    action {{actionStaticId}} (
        position: {{action.position}}
        template: {{action.template}}
        label: {{action.label}}
        layout {
            sequence: {{action.layout.sequence}}
        }
        behavior {
            type: {{action.behavior.type}}
            target: {{action.behavior.target}}
            targetUrl: {{action.behavior.targetUrl}}
            linkAttributes: {{action.behavior.linkAttributes}}
        }
    )
    column {{column.name}} (
        layout {
            sequence: {{column.layout.sequence}}
        }
        source {
            databaseColumn: {{column.source.databaseColumn}}
            dataType: {{column.source.dataType}}
            primaryKey: {{column.source.primaryKey}}
        }
    )
)
```

---

# Conditional Rendering Rules

- In `partial` mode, omit report-only blocks such as grouping, row selection, and pagination.
- In `report` mode, include a PK-backed column when row identity matters.
- In `report` mode with any `source.location`, emit immediate child `column (...)` blocks using the multiline layout/source shape shown above. Do not emit one-line child blocks such as `layout { sequence: 10 }`.
- By default, emit a Content Row child column for every delivered source projection in region-source order.
- At minimum, the emitted child columns must still cover row identity, `settings`, `plugin-avatar`, `plugin-badge`, row selection, row actions, and deterministic sorting, but the default generated shape should mirror the full source projection rather than a compiler-minimum subset.
- When `pagination {}` is emitted, define `pagination.type: page` or `pagination.type: scroll`.
- Use `pagination.entitiesPerPage` only when the page-based experience needs an explicit page size.
- Render `action.template` only for `position: primaryActions`.
- Render nested `menu` entries only when `template: menu`.
- For `settings.overline`, `settings.title`, `settings.description`, and `settings.miscellaneous`, use `&COLUMN_NAME.` substitution for query-column mappings; literal strings such as `overline: Employee` are allowed when they are not query-column mappings.
- Use `rowSelection { type: focusOnly }` for focus-only row behavior with no selection page items. Use `rowSelection { type: singleSelection currentSelectionPageItem: Pn_SELECTED_KEY }` for native single-row selection. Use `rowSelection { type: multipleSelection currentSelectionPageItem: Pn_SELECTED_KEYS selectAllPageItem: Pn_SELECT_ALL }` for native multi-row selection.
- Use `position: fullRowLink` for row navigation and required master-detail context setting; do not use `primaryActions` for the primary row-selection affordance.
- For same-page master-detail parent-child selection, set the hidden context item from the row PK using `behavior.target.items` with `&COLUMN.` substitution. Native `rowSelection.currentSelectionPageItem` does not satisfy this requirement.
- When any `rowSelection` mode is used, keep one child column marked with `source.primaryKey: true`.
- For SQL-backed Content Row regions, remove ordering from `source.sqlQuery` and emit a top-level `orderBy` block immediately after `source`.
- For static sorting, `orderBy.orderByClause` contains only the clause body, for example `order_datetime desc, order_id desc`.
- For item-controlled sorting, use the exact object shape `orderBy { type: item item: { itemName: Pn_SORT orderBys: { KEY: ORDER BY ... } } }` and ensure `itemName` refers to a page item on the same page.
- When any child column carries a grouping property, ensure the top-level `orderBy` starts with every grouped column in grouping order before any remaining tie-breakers.
- Keep `plugin-avatar` configuration-only; avatar visibility is controlled by `settings.displayAvatar`.
- Keep `plugin-badge` configuration-only; badge visibility is controlled by `settings.displayBadge`.
- Use `plugin-badge.style` and `plugin-badge.shape` only when the prompt explicitly requests a visual badge treatment.
- Use `plugin-badge.icon` only when the prompt explicitly requests badge iconography.
- Use `plugin-badge.position` only when the prompt explicitly requests a start/end badge placement override.
- Keep optional plugin groups (`plugin-avatar`, `plugin-badge`, `plugin-appearance`, `plugin-grouping`) only when required by prompt.

# Validation Checklist

- Region type is `themeTemplateComponent/contentRow`.
- All actions use supported positions.
- `primaryActions` does not use unsupported templates.
- Component blocks declared with parentheses close with `)`.
- Column mappings use `databaseColumn`.
- `position`, when present in `plugin-badge`, uses a supported placement value.
- Content Row URL actions use `behavior.targetUrl`; same-application page actions use structured `behavior.target` when supported.
- `settings` references columns that exist in the source query/columns and uses `&COLUMN_NAME.` syntax for column-backed display values.
- SQL-backed Content Row regions include `orderBy {}`; `source.sqlQuery` contains no `ORDER BY`.
- `orderBy.type` is `staticValue` or `item`. `staticValue` includes `orderByClause`; `item` includes `itemName` and `orderBys`.
- When any child column uses grouping, `orderBy` sorts by all grouped columns first before any non-grouping tie-breakers.
- Native row selection uses `rowSelection.type: focusOnly|singleSelection|multipleSelection`. `focusOnly` emits no selection page items. `singleSelection` includes `currentSelectionPageItem`, and the referenced hidden page item exists on the page. `multipleSelection` includes `currentSelectionPageItem` and `selectAllPageItem`, with a hidden current-selection item and same-page checkbox select-all item.
- Master-detail parent-child filtering includes a `fullRowLink` action that sets the hidden context item through `behavior.target.items`; native `rowSelection.currentSelectionPageItem` alone does not satisfy drill-down/context setting.
- When native row selection is present, at least one immediate child column carries `source.primaryKey: true`.
- Content Row pagination uses `pagination.type: page` or `scroll`; do not emit classic-report pagination tokens.
- Report-mode Content Row columns are immediate region children and must define multiline `layout { sequence: ... }` plus `source { databaseColumn: ... dataType: ... }`; add `primaryKey: true` only on the identity column.
