---
templateId: page.marquee
component: page
dslVersion: 1.0
description: Theme 42 marquee page layout with hero, master-detail, and right-column display points.
---

## Purpose
Apply the shared non-dialog page contract to the Theme 42 `Marquee` page template. Use this layout for landing, dashboard, and master-detail pages that need a strong top section plus supporting side content.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| base page vars | inherited | `page.common` | Load [`../_shared/page.common.md`](../_shared/page.common.md) first. |
| appearance.pageTemplate | yes | string | Must be `@/marquee`. |
| appearance.templateOptions | optional | string or array | Usually `#DEFAULT#` or `sticky-header-on-mobile`; use the `static_id` values from the inventory in [`../README.md`](../README.md). |
| layout slots | derived | slot set | Standard-slot family plus `REGION_POSITION_02` (`masterDetail`) and `REGION_POSITION_03` (`rightSideColumn`). |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageTemplate: @/marquee
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

    region hero (
        name: [heroRegionName]
        type: [heroRegionType]
        layout {
            sequence: 10
            slot: REGION_POSITION_07
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
- `REGION_POSITION_07` (`banner`): Top marquee or hero content.
- `REGION_POSITION_02` (`masterDetail`): Master-detail or highlight content block.
- `REGION_POSITION_03` (`rightSideColumn`): Secondary supporting content.
- `BODY`: Main page content.
- Standard slots such as `REGION_POSITION_01`, `REGION_POSITION_04`, `REGION_POSITION_05`, `REGION_POSITION_06`, and `REGION_POSITION_08` remain available.

## Conditional Rules
- Keep marquee and master-detail content distinct so the hero area does not become a second main body.
- Put dialogs and drawers in `REGION_POSITION_04` even when the page already uses both side slots.

## Guardrails
- Use this template when the hero and supporting rails are intentional parts of the information architecture.
- Avoid filling every available slot by default; a marquee page should still preserve visual hierarchy.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/marquee.sql`
