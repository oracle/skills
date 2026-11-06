---
templateId: page.drawer.basic
component: page
dslVersion: 1.0
imports:
  - drawer._common.md
description: Baseline drawer page example with body content and a footer region host.
---

## Purpose
Provide a baseline `@/drawer` example for side-sheet and sheet-style modal workflows.

## Template
```apexlang
page 100 (
    name: Drawer Details
    alias: DRAWER-DETAILS
    title: Drawer Details
    appearance {
        pageMode: modalDialog
        dialogTemplate: @/drawer
        templateOptions: #DEFAULT#
    }
    navigation {
        cursorFocus: doNotFocusCursor
    }
    security {
        authorizationScheme: mustNotBePublicUser
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
    }

    region CONTENT (
        name: Content
        type: staticContent
        layout {
            sequence: 10
            slot: BODY
        }
    )

    region FOOTER (
        name: Footer
        type: staticContent
        layout {
            sequence: 20
            slot: REGION_POSITION_03
        }
    )
)
```

## Notes
- Host create, edit, close, and next actions in a footer region or inline-drawer pattern anchored to `REGION_POSITION_03`.
- Keep drawer headers or helper actions in `REGION_POSITION_01` when required.
- Use drawer position and size template options instead of custom CSS classes.
