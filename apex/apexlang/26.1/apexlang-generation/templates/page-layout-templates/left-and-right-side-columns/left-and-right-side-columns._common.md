---
templateId: page.left-and-right-side-columns
component: page
dslVersion: 1.0
description: Standard Theme 42 page layout with both left and right side columns.
---

## Purpose
Apply the shared non-dialog page contract to the Theme 42 `Left and Right Side Columns` page template. Use this layout when the page needs persistent content on both sides of the main body.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| base page vars | inherited | `page.common` | Load [`../_shared/page.common.md`](../_shared/page.common.md) first. |
| appearance.pageTemplate | yes | string | Must be `@/left-and-right-side-columns`. |
| appearance.templateOptions | optional | string or array | Usually `#DEFAULT#` or `sticky-header-on-mobile`; use the `static_id` values from the inventory in [`../README.md`](../README.md). |
| layout slots | derived | slot set | Standard slots plus `REGION_POSITION_02` (`leftColumn`) and `REGION_POSITION_03` (`rightColumn`). |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageTemplate: @/left-and-right-side-columns
        templateOptions: [appearance.templateOptions]
    }
    navigation {
        cursorFocus: doNotFocusCursor
    }
    security {
        authorizationScheme: mustNotBePublicUser
        pageAccessProtection: [security.pageAccessProtection]
        formAutoComplete: false
    }

    region leftRail (
        name: [leftRailName]
        type: [leftRailType]
        layout {
            sequence: 10
            slot: REGION_POSITION_02
        }
    )

    region content (
        name: [contentRegionName]
        type: [contentRegionType]
        layout {
            sequence: 20
            slot: BODY
        }
    )

    region rightRail (
        name: [rightRailName]
        type: [rightRailType]
        layout {
            sequence: 30
            slot: REGION_POSITION_03
        }
    )
)
```

## Slot Guidance
- `REGION_POSITION_02` (`leftColumn`): Navigation, filters, or status summaries.
- `REGION_POSITION_03` (`rightColumn`): Inspector panels, related actions, or contextual detail.
- In the current Theme 42 implementation, both side rails are fixed-width columns of about `15rem` each. Treat that width as a build-pinned selection heuristic, not as a tunable page-grid split.
- When one rail is intended to select or drive the main body content, prefer the left rail for that local navigation or chooser role and keep the opposite rail for supporting detail, actions, or inspection.
- All standard-page slots remain available.

## Conditional Rules
- Keep the left and right rails focused on distinct concerns; avoid duplicating page actions across both.
- If the left rail contains contextual sub-navigation for a local page cluster, keep that same sub-navigation menu on every page in that cluster rather than only on the entry page.
- If one rail is optional in most scenarios, reassess whether a single-column template would be clearer.

## Guardrails
- Use this template only when both side rails are consistently meaningful across the page's primary use cases.
- If either side needs to behave like a wider or adjustable sidebar, prefer a different page shell and explicit body-grid coordinates.
- Keep the main body as the dominant content area; side rails should stay secondary.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/left_and_right_side_columns.sql`
