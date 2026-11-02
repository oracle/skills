---
templateId: page.left-side-column
component: page
dslVersion: 1.0
description: Standard Theme 42 page layout with an additional left column slot.
---

## Purpose
Apply the shared non-dialog page contract to the Theme 42 `Left Side Column` page template. Use this layout when navigation-adjacent or summary content belongs in a persistent left rail.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| base page vars | inherited | `page.common` | Load [`../_shared/page.common.md`](../_shared/page.common.md) first. |
| appearance.pageTemplate | yes | string | Must be `@/left-side-column`. |
| appearance.templateOptions | optional | string or array | Usually `#DEFAULT#` or `sticky-header-on-mobile`; use the `static_id` values from the inventory in [`../README.md`](../README.md). |
| layout slots | derived | slot set | Standard slots plus `leftColumn`. |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageTemplate: @/left-side-column
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

    region sideContent (
        name: [sideRegionName]
        type: [sideRegionType]
        layout {
            sequence: 10
            slot: leftColumn
        }
    )

    region content (
        name: [contentRegionName]
        type: [contentRegionType]
        layout {
            sequence: 20
            slot: body
        }
    )
)
```

## Slot Guidance
- `leftColumn`: Side-rail filters, status panels, or contextual navigation.
- In the current Theme 42 implementation, `leftColumn` is a fixed-width rail of about `15rem`. Treat that width as a build-pinned selection heuristic, not a tunable body-grid ratio.
- Prefer this rail when the left-side content is meant to drive or select what appears in the main body, for example a contextual sub-navigation menu, section chooser, or parent selector whose current choice determines the main pane content.
- All standard-page slots remain available.
- For the standard faceted-search pattern, place the faceted-search region in `leftColumn` and keep the filtered results region in `body`.

## Conditional Rules
- Hide the left column region when the page has no contextual side content instead of moving that content into the main body.
- When the rail contains contextual sub-navigation to sibling pages, keep that same sub-navigation menu on each page it links to so the local navigation context remains stable after navigation.
- Keep actionable overlay launch regions in `REGION_POSITION_04`.

## Guardrails
- Use this template only when the left rail is part of the page contract. Otherwise prefer `@/standard`.
- If the requirement needs a wider or tunable sidebar-main ratio such as `4/8` or `3/9`, prefer `@/standard` plus explicit body-grid coordinates instead of this fixed rail.
- Do not treat contextual sub-navigation as a one-page-only decoration; when it defines a local page group, repeat it across that group's linked pages.
- Do not place full-width bands in the left-column slot; use `REGION_POSITION_08` for breakout content.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/left_side_column.sql`
- Internal template-source metadata (`page-left-side-column`)
