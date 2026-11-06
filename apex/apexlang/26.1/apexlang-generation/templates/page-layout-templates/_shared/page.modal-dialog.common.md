---
templateId: page.modal-dialog.common
component: page
dslVersion: 1.0
description: Shared contract for standard modal dialog page layouts.
---

## Purpose
Define the page-level variables, slot usage, and guardrails for modal dialog pages that use `appearance.pageMode: modalDialog`.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| pageNumber | yes | number | Page identifier. |
| name | yes | string | Page name. |
| alias | yes | string | Page alias. |
| title | optional | string | Dialog title. |
| appearance.pageMode | yes | enum | Must be `modalDialog`. |
| appearance.dialogTemplate | yes | string | Dialog template reference such as `@/modal-dialog` or `@/wizard-modal-dialog`. |
| appearance.templateOptions | optional | string or array | Dialog-template options supported by the chosen template; use the accepted values documented in [`../README.md`](../README.md), keep `#DEFAULT#` standalone, and do not substitute emitted CSS classes. |
| security.authorizationScheme | required | alias | Defaults to `mustNotBePublicUser` for generated non-login dialog pages unless a stricter functional authorization scheme is supplied. |
| security.pageAccessProtection | required | enum | Must be `argumentsMustHaveChecksum` for generated non-login dialog pages. |
| layout slots | derived | slot set | Standard modal dialogs use `BODY`, `REGION_POSITION_01`, and `REGION_POSITION_03`. |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageMode: modalDialog
        dialogTemplate: [appearance.dialogTemplate]
        templateOptions: [appearance.templateOptions]
    }
    security {
        authorizationScheme: [security.authorizationScheme]
        pageAccessProtection: [security.pageAccessProtection]
        formAutoComplete: false
    }

    region content (
        name: [contentRegionName]
        type: [contentRegionType]
        layout {
            sequence: 10
            slot: contentBody
        }
    )
)
```

## Slot Guidance
- `contentBody`: Main dialog content. Do not emit `body` or `BODY` for modal form regions; the live compiler expects the modal semantic slot.
- `REGION_POSITION_01`: Dialog header content.
- `REGION_POSITION_03`: Dialog footer content, often a button region.

## Conditional Rules
- Keep close and submit logic on explicit buttons and processes rather than relying on custom JavaScript.
- Put optional dialog header or footer regions behind conditions when the page can run in compact or full modes.
- Generated dialog pages must keep `authorizationScheme: mustNotBePublicUser` unless functional requirements select a stricter existing scheme.

## Guardrails
- Every dialog page should keep `appearance.pageMode: modalDialog`.
- Use the dialog template that matches the intended chrome instead of retrofitting a standard page with modal behavior.
- When the page needs wizard-specific header and footer semantics, switch to `@/wizard-modal-dialog`.
- Pass dialog option `static_id` values such as `remove-body-padding` or `stretch-to-fit-window`, not the emitted CSS class string.
- Never concatenate `#DEFAULT#` with another template-option value.
- Do not emit public dialog pages by default.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/modal_dialog.sql`
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/wizard_modal_dialog.sql`
- Internal template-source metadata
