---
templateId: page.standard
component: page
dslVersion: 1.0
description: Canonical full-page Theme 42 layout with body, footer, and navigation slots.
---

## Purpose
Apply the shared non-dialog page contract to the Theme 42 `Standard` page template. This is the default layout for general-purpose application pages.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| base page vars | inherited | `page.common` | Load [`../_shared/page.common.md`](../_shared/page.common.md) first. |
| appearance.pageTemplate | yes | string | Must be `@/standard`. |
| appearance.templateOptions | optional | string or array | Usually `#DEFAULT#` or `sticky-header-on-mobile`; use the `static_id` values from the inventory in [`../README.md`](../README.md). |
| layout slots | derived | slot set | `AFTER_LOGO`, `AFTER_NAVIGATION_BAR`, `REGION_POSITION_07`, `BEFORE_NAVIGATION_BAR`, `BODY`, `REGION_POSITION_01`, `REGION_POSITION_04`, `REGION_POSITION_05`, `REGION_POSITION_08`, `REGION_POSITION_06`. |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageTemplate: @/standard
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

    region titleBar (
        name: [titleBarName]
        type: [titleBarType]
        layout {
            sequence: 10
            slot: REGION_POSITION_01
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
)
```

## Slot Guidance
- `BODY` (`body`): Main page content.
- `REGION_POSITION_01` (`breadcrumbBar`): Breadcrumb or title-bar region.
- `REGION_POSITION_04` (`dialogsDrawersAndPopups`): Overlay launch surfaces.
- `REGION_POSITION_05` (`footer`): Footer content or supporting actions.
- `REGION_POSITION_06` (`topNavigation`): Top navigation or utility regions.
- `REGION_POSITION_08` (`fullWidthContent`): Full-width bands that sit outside the contained body.
- `AFTER_LOGO`, `AFTER_NAVIGATION_BAR`, `BEFORE_NAVIGATION_BAR`, `REGION_POSITION_07`: Header and banner extension points.

## Conditional Rules
- Put optional hero, banner, and navigation-adjacent regions in their dedicated slots instead of overloading `BODY`.
- Use `REGION_POSITION_08` only for content that should break out of the standard page container.

## Guardrails
- Treat this template as the baseline layout unless the page explicitly needs side columns, login chrome, or dialog behavior.
- Keep sticky-header usage aligned with the Theme 42 mobile option instead of custom page CSS classes.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/standard.sql`
- Internal template-source metadata (`page-standard`)
