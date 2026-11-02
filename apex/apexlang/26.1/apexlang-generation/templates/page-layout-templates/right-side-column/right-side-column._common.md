---
templateId: page.right-side-column
component: page
dslVersion: 1.0
description: Standard Theme 42 page layout with an additional right column slot.
---

## Purpose
Apply the shared non-dialog page contract to the Theme 42 `Right Side Column` page template. Use this layout when secondary information or actions belong in a right rail.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| base page vars | inherited | `page.common` | Load [`../_shared/page.common.md`](../_shared/page.common.md) first. |
| appearance.pageTemplate | yes | string | Must be `@/right-side-column`. |
| appearance.templateOptions | optional | string or array | Usually `#DEFAULT#` or `sticky-header-on-mobile`; use the `static_id` values from the inventory in [`../README.md`](../README.md). |
| layout slots | derived | slot set | Standard slots plus `REGION_POSITION_03` (`rightColumn`). |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageTemplate: @/right-side-column
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

    region content (
        name: [contentRegionName]
        type: [contentRegionType]
        layout {
            sequence: 10
            slot: BODY
        }
    )

    region rightRail (
        name: [rightRailName]
        type: [rightRailType]
        layout {
            sequence: 20
            slot: REGION_POSITION_03
        }
    )
)
```

## Slot Guidance
- `REGION_POSITION_03` (`rightColumn`): Supporting cards, contextual actions, and inspector-style content.
- In the current Theme 42 implementation, `rightColumn` is a fixed-width rail of about `15rem`. Treat that width as a build-pinned selection heuristic, not a tunable body-grid ratio.
- Use this rail for selector-driven main-pane behavior only when the UX intentionally places the controlling chooser or contextual inspector on the right; otherwise prefer the left rail for navigation-like patterns.
- All standard-page slots remain available.

## Conditional Rules
- Keep the right rail conditional when it depends on selected content or page mode.
- Avoid moving right-rail actions into the footer unless they truly belong to the whole page.

## Guardrails
- Use this template when the right rail is structurally part of the page, not as a workaround for crowded main content.
- If the requirement needs a wider or tunable sidebar-main ratio, prefer `@/standard` plus explicit body-grid coordinates instead of this fixed rail.
- Reserve `REGION_POSITION_03` for narrow supporting content rather than full-width reports or forms.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/right_side_column.sql`
