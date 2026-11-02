---
templateId: page.wizard-modal-dialog.basic
component: page
dslVersion: 1.0
imports:
  - wizard-modal-dialog._common.md
description: Single-step wizard modal dialog with progress, content, and button-strip regions.
---

## Purpose
Provide a baseline `@/wizard-modal-dialog` example for a single-step wizard flow.

## Template
```apexlang
page 200 (
    name: Wizard Step 1
    alias: WIZARD-STEP-1
    title: Step 1
    appearance {
        pageMode: modalDialog
        dialogTemplate: @/wizard-modal-dialog
        templateOptions: #DEFAULT#
    }
    security {
        authorizationScheme: mustNotBePublicUser
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
    }

    region PROGRESS (
        name: Progress
        type: staticContent
        layout {
            sequence: 10
            slot: REGION_POSITION_01
        }
    )

    region STEP_CONTENT (
        name: Step Content
        type: staticContent
        layout {
            sequence: 20
            slot: BODY
        }
    )

    region BUTTONS (
        name: Buttons
        type: staticContent
        layout {
            sequence: 30
            slot: REGION_POSITION_03
        }
    )
)
```

## Notes
- Populate the `BUTTONS` region with back, next, finish, and cancel actions appropriate to the flow.
- Swap the static content region for a form region or additional components as needed.
- Use request- or item-based conditions to control wizard actions across steps.
