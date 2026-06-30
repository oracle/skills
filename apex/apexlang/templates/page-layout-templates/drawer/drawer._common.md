---
templateId: page.drawer
component: page
dslVersion: 1.0
description: Theme 42 drawer page template for off-canvas modal dialogs.
---

## Purpose
Apply the shared drawer contract to the Theme 42 `Drawer` page template. Use this layout when a modal page should slide in from a page edge or from the top or bottom.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| base drawer vars | inherited | `page.drawer.common` | Load [`../_shared/page.drawer.common.md`](../_shared/page.drawer.common.md) first. |
| appearance.dialogTemplate | yes | string | Must be `@/drawer`. |
| appearance.templateOptions | optional | string or array | Live-valid drawer option values. For APEX 26.1 position, use values such as `js-dialog-class-t-Drawer--pullOutEnd`; do not emit stale short IDs such as `end`, `start`, `top`, or `bottom`. |
| layout slots | derived | slot set | `BODY` (`contentBody`), `REGION_POSITION_01` (`dialogHeader`), `REGION_POSITION_03` (`dialogFooter`). |

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
- `BODY`: Main drawer content.
- `REGION_POSITION_01`: Header content such as title bars or helper actions.
- `REGION_POSITION_03`: Footer region, usually the host for dialog buttons.

## Conditional Rules
- Keep create and edit action sets conditional when the drawer is reused across multiple flows.
- Use live-valid pull-out drawer option values for side-sheet or sheet-style patterns.

## Guardrails
- Do not mix custom page CSS classes with Theme 42 drawer position classes unless the underlying template option already defines them.
- Keep drawer content focused and task-oriented; large multi-section workflows should move to a wizard dialog or full page.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/drawer.sql`
- Internal template-source metadata (`page-drawer`)
