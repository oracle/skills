---
templateId: page.drawer.common
component: page
dslVersion: 1.0
description: Shared contract for drawer modal dialog page layouts.
---

## Purpose
Define page-level variables, slot usage, and guardrails for drawer-style modal dialog pages that use the Theme 42 `Drawer` page template.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| pageNumber | yes | number | Page identifier. |
| name | yes | string | Page name. |
| alias | yes | string | Page alias. |
| title | optional | string | Drawer title. |
| appearance.pageMode | yes | enum | Must be `modalDialog`. |
| appearance.dialogTemplate | yes | string | Must resolve to the drawer template, `@/drawer`. |
| appearance.templateOptions | optional | string or array | Drawer position and size options supported by Theme 42; use the accepted values documented in [`../README.md`](../README.md), keep `#DEFAULT#` standalone, and do not substitute emitted CSS classes. |
| security.authorizationScheme | required | alias | Defaults to `mustNotBePublicUser` for generated non-login drawer pages unless a stricter functional authorization scheme is supplied. |
| security.pageAccessProtection | required | enum | Must be `argumentsMustHaveChecksum` for generated non-login drawer pages. |
| page slots | derived | slot set | `BODY` (`contentBody`), `REGION_POSITION_01` (`dialogHeader`), `REGION_POSITION_03` (`dialogFooter`). |
| footer button patterns | derived | slot set | Drawer footer implementations commonly expose `PREVIOUS`, `DELETE`, `CLOSE`, `EDIT`, `CREATE`, `NEXT`, and `FOOTER` through a footer region or the inline-drawer region template. |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageMode: modalDialog
        dialogTemplate: @/drawer
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
            slot: BODY
        }
    )
)
```

## Slot Guidance
- `BODY`: Drawer body content.
- `REGION_POSITION_01`: Drawer header content.
- `REGION_POSITION_03`: Drawer footer content, typically a buttons region.
- `NEXT`, `PREVIOUS`, `CLOSE`, `EDIT`, `CREATE`, `DELETE`: Common button-slot tokens used by footer button containers and the inline drawer region template.

## Conditional Rules
- Use conditions to tailor footer actions for create, edit, and read-only drawer scenarios.
- Keep page-level footer content small; large supporting regions belong in the drawer body instead.
- Generated drawer pages must keep `authorizationScheme: mustNotBePublicUser` unless functional requirements select a stricter existing scheme.

### Condition Examples
```apexlang
serverSideCondition {
    type: itemIsNotNull
    item: P100_ID
}

serverSideCondition {
    type: request!=Value
    value: WIZARD
}
```

## Guardrails
- Keep `appearance.pageMode: modalDialog` and `appearance.dialogTemplate: @/drawer` together.
- Align drawer position and size values with the live compiler/theme inventory in [`../README.md`](../README.md). For APEX 26.1 drawer position, emit values such as `js-dialog-class-t-Drawer--pullOutEnd`; do not emit stale short IDs such as `end`.
- Never concatenate `#DEFAULT#` with another template-option value.
- When the footer needs button-slot semantics, route them through a footer region pattern rather than treating them as page display points.
- Do not emit public drawer pages by default.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/drawer.sql`
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/region/inline_drawer.sql`
- Internal template-source metadata (`page-drawer`)
