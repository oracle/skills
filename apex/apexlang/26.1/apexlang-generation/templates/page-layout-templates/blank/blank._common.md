---
templateId: page.blank
component: page
dslVersion: 1.0
description: Blank page layout with only body content and overlay support.
---

## Purpose
Apply the shared non-dialog page contract to the Theme 42 `Blank` page template. Use this layout for utility pages, embedded surfaces, and stripped-down pages that still need APEX page lifecycle behavior.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| base page vars | inherited | `page.common` | Load [`../_shared/page.common.md`](../_shared/page.common.md) first. |
| appearance.pageTemplate | yes | string | Must be `@/blank`. |
| appearance.templateOptions | optional | string or array | `#DEFAULT#` or `contain-body-content`; use the `static_id` values from the inventory in [`../README.md`](../README.md). |
| layout slots | derived | slot set | `BODY` (`body`), `REGION_POSITION_04` (`dialogsDrawersAndPopups`). |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageTemplate: @/blank
        templateOptions: [appearance.templateOptions]
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
- `BODY`: Main content region or free-form page body.
- `REGION_POSITION_04`: Supporting dialogs, drawers, and popup-capable regions.

## Conditional Rules
- Keep supporting overlays out of `BODY` when they are launched or hidden by default.
- Use page-level conditions sparingly; blank pages are usually simplest when most logic sits on the main content region.

## Guardrails
- Do not use this template when the page needs breadcrumb, footer, or navigation display points.
- If the page should render contained content instead of full-width content, align the chosen option with the Theme 42 blank-template body containment setting.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/blank.sql`
