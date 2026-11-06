---
templateId: page.minimal-no-navigation
component: page
dslVersion: 1.0
description: Focused Theme 42 page layout with standard content slots but no navigation chrome.
---

## Purpose
Apply the shared non-dialog page contract to the Theme 42 `Minimal (No Navigation)` page template. Use this layout for focused tasks, embedded flows, or utility pages that should avoid full app navigation.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| base page vars | inherited | `page.common` | Load [`../_shared/page.common.md`](../_shared/page.common.md) first. |
| appearance.pageTemplate | yes | string | Must be `@/minimal-no-navigation`. |
| appearance.templateOptions | optional | string or array | Usually `#DEFAULT#` or `sticky-header-on-mobile`; use the `static_id` values from the inventory in [`../README.md`](../README.md). |
| layout slots | derived | slot set | `AFTER_LOGO`, `AFTER_NAVIGATION_BAR`, `REGION_POSITION_07`, `BEFORE_NAVIGATION_BAR`, `BODY`, `REGION_POSITION_01`, `REGION_POSITION_04`, `REGION_POSITION_05`, `REGION_POSITION_08`, `REGION_POSITION_06`. |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageTemplate: @/minimal-no-navigation
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
)
```

## Slot Guidance
- `BODY`: Primary content area.
- `REGION_POSITION_01`: Breadcrumb or page-title content when needed.
- `REGION_POSITION_04`: Dialogs, drawers, and popup launch regions.
- `REGION_POSITION_05`: Footer content.
- `REGION_POSITION_06`: Optional top navigation or utility content even though the page omits the standard nav chrome.

## Conditional Rules
- Prefer this template when navigation should be intentionally absent rather than merely hidden by conditions.
- Keep banner and footer regions optional unless the task flow truly needs them.

## Guardrails
- Do not use this template as a substitute for access control; it is a layout decision, not a security mode.
- When the page starts accumulating column-based content, switch to a more explicit page template.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/minimal_no_navigation.sql`
