---
templateId: page.wizard-modal-dialog
component: page
dslVersion: 1.0
description: Wizard-oriented modal dialog page layout with dedicated progress and button slots.
---

## Purpose
Apply the shared modal dialog contract to the Theme 42 `Wizard Modal Dialog` page template. Use this layout when a modal page needs explicit wizard progress and a dedicated button strip.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| base dialog vars | inherited | `page.modal-dialog.common` | Load [`../_shared/page.modal-dialog.common.md`](../_shared/page.modal-dialog.common.md) first. |
| appearance.dialogTemplate | yes | string | Must be `@/wizard-modal-dialog`. |
| appearance.templateOptions | optional | string or array | `#DEFAULT#`, `remove-body-padding`, or `stretch-to-fit-window`; use the `static_id` values from the inventory in [`../README.md`](../README.md). |
| layout slots | derived | slot set | `BODY` (`wizardBody`), `REGION_POSITION_01` (`wizardProgressBar`), `REGION_POSITION_03` (`wizardButtons`). |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageMode: modalDialog
        dialogTemplate: @/wizard-modal-dialog
        templateOptions: [appearance.templateOptions]
    }
    security {
        authorizationScheme: mustNotBePublicUser
        pageAccessProtection: [security.pageAccessProtection]
        formAutoComplete: false
    }

    region progress (
        name: [progressRegionName]
        type: [progressRegionType]
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

    region buttons (
        name: [buttonsRegionName]
        type: [buttonsRegionType]
        layout {
            sequence: 30
            slot: REGION_POSITION_03
        }
    )
)
```

## Slot Guidance
- `REGION_POSITION_01`: Wizard progress bar or step indicator content.
- `BODY`: Main wizard step content.
- `REGION_POSITION_03`: Wizard button strip.

## Conditional Rules
- Keep step-specific buttons conditional by wizard state instead of duplicating page templates.
- Use footer button logic that clearly distinguishes back, next, finish, and cancel actions.

## Guardrails
- Choose this template only when the page has real wizard semantics. Standard dialogs should stay on `@/modal-dialog`.
- Keep wizard progress in `REGION_POSITION_01`; do not repurpose it for general header content.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/wizard_modal_dialog.sql`
- `core/wwv_flow_theme.plb`
