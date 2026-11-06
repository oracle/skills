---
templateId: page.common
component: page
dslVersion: 1.0
description: Shared contract for non-dialog Theme 42 page layouts.
---

## Purpose
Define the base page-level fields, common navigation and security defaults, and shared slot-token guidance for non-dialog page layouts that use `appearance.pageTemplate`.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| pageNumber | yes | number | Page identifier. |
| name | yes | string | Page name. |
| alias | yes | string | Page alias. |
| title | optional | string | Browser and page title. |
| appearance.pageTemplate | yes | string | Theme 42 page template reference such as `@/standard`. |
| appearance.templateOptions | optional | string or array | Template options supported by the chosen page template; use the accepted values documented in [`../README.md`](../README.md), keep `#DEFAULT#` standalone, and do not substitute emitted CSS classes. |
| navigation.cursorFocus | optional | enum | Usually `doNotFocusCursor`. |
| security.authorizationScheme | required | alias | Defaults to `mustNotBePublicUser` for generated non-login business pages unless a stricter functional authorization scheme is supplied. |
| security.pageAccessProtection | required | enum | Must be `argumentsMustHaveChecksum` for generated non-login business pages. |
| security.formAutoComplete | optional | boolean | Typically `false` for generated examples. |
| layout slots | derived | slot set | Usually `BODY`, `REGION_POSITION_01`, `REGION_POSITION_04`, `REGION_POSITION_05`; some templates add column or nav slots. |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageTemplate: [appearance.pageTemplate]
        templateOptions: [appearance.templateOptions]
    }
    navigation {
        cursorFocus: doNotFocusCursor
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
            slot: BODY
        }
    )
)
```

## Slot Guidance
- `BODY`: Primary page content. Theme 42 semantic alias is usually `body`.
- `REGION_POSITION_01`: Header or breadcrumb bar content. Common semantic alias is `breadcrumbBar`.
- `REGION_POSITION_04`: Dialogs, drawers, and popup launch surfaces.
- `REGION_POSITION_05`: Footer content and low-priority actions.
- Template-specific slots such as `REGION_POSITION_02`, `REGION_POSITION_03`, `REGION_POSITION_06`, `REGION_POSITION_08`, `AFTER_LOGO`, `AFTER_NAVIGATION_BAR`, and `BEFORE_NAVIGATION_BAR` should only be used when the selected template exposes them.

## Conditional Rules
- Put server-side conditions on regions, items, buttons, and processes instead of the page template declaration.
- Hide optional side-column or footer content rather than moving it into `BODY`.
- Use `REGION_POSITION_04` for dialog-capable supporting regions so page chrome and launched overlays stay separated.
- Generated business pages must keep `authorizationScheme: mustNotBePublicUser` unless functional requirements select a stricter existing scheme.

## Guardrails
- Use `appearance.pageTemplate` only for non-dialog pages. Dialog families should use `appearance.pageMode: modalDialog` plus `appearance.dialogTemplate`.
- Keep `templateOptions` aligned with the owning Theme 42 template definition and the inventory in [`../README.md`](../README.md).
- Pass caller-facing `static_id` values such as `sticky-header-on-mobile` or `contain-body-content`, not the emitted CSS class string.
- Never concatenate `#DEFAULT#` with another template-option value.
- Prefer checked-in slot tokens such as `BODY` or `REGION_POSITION_01` in examples and generated snippets.
- Do not omit page-level authorization for non-login pages; public access is login-page only unless a security-review rationale is emitted.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/standard.sql`
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/left_side_column.sql`
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/right_side_column.sql`
- Internal template-source metadata
