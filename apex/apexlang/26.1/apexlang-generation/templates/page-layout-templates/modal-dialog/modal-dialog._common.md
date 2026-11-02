---
templateId: page.modal-dialog
component: page
dslVersion: 1.0
description: Standard Theme 42 modal dialog page layout.
---

## Purpose
Apply the shared modal dialog contract to the Theme 42 `Modal Dialog` page template. This is the default dialog page surfaced by the generator's dialog defaults.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| base dialog vars | inherited | `page.modal-dialog.common` | Load [`../_shared/page.modal-dialog.common.md`](../_shared/page.modal-dialog.common.md) first. |
| appearance.dialogTemplate | yes | string | Must be `@/modal-dialog`. |
| appearance.templateOptions | optional | string or array | `#DEFAULT#`, `remove-body-padding`, or `stretch-to-fit-window`; use the `static_id` values from the inventory in [`../README.md`](../README.md). |
| layout slots | derived | slot set | `BODY` (`contentBody`), `REGION_POSITION_01` (`dialogHeader`), `REGION_POSITION_03` (`dialogFooter`). |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageMode: modalDialog
        dialogTemplate: @/modal-dialog
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
- `BODY`: Main dialog content.
- `REGION_POSITION_01`: Title bar, breadcrumb-style context, or compact helper content.
- `REGION_POSITION_03`: Footer content such as dialog button regions.

## Conditional Rules
- Put submit and cancel buttons in the footer slot when the page follows the standard dialog pattern.
- Use explicit close-dialog processing after successful submit flows so parent pages can refresh predictably.

## Guardrails
- Keep the dialog footer focused on actions rather than large supporting regions.
- Use the stretch option only when the dialog truly needs viewport-sized content.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/modal_dialog.sql`
- Internal template-source metadata (`dialogDefaults`)
