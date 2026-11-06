---
templateId: page.modal-dialog.basic
component: page
dslVersion: 1.0
imports:
  - modal-dialog._common.md
description: Baseline modal dialog example with body content and a footer region host.
---

## Purpose
Provide a baseline `@/modal-dialog` example for standard dialog interactions.

## Template
```apexlang
page 160 (
    name: Modal Dialog
    alias: MODAL-DIALOG
    title: Modal Dialog
    appearance {
        pageMode: modalDialog
        dialogTemplate: @/modal-dialog
        templateOptions: #DEFAULT#
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
- Host submit and cancel buttons in a footer region anchored to `REGION_POSITION_03`.
- Add header context in `REGION_POSITION_01` only when the dialog needs more than the default title chrome.
- Use explicit submit and close-dialog processing so the calling page can refresh predictably.
