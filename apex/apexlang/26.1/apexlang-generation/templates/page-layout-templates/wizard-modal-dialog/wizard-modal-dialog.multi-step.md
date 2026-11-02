---
templateId: page.wizard-modal-dialog.multi-step
component: page
dslVersion: 1.0
imports:
  - wizard-modal-dialog._common.md
description: Three-step wizard modal dialog demonstrating progress, step regions, and request-driven button states.
---

## Purpose
Document a three-step wizard modal dialog layout where step regions and footer actions are controlled by request values such as `STEP1`, `STEP2`, and `STEP3`.

## Template
```apexlang
page 210 (
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
            sequence: 5
            slot: REGION_POSITION_01
        }
    )

    region STEP1_CONTENT (
        name: Step 1 Content
        type: staticContent
        layout {
            sequence: 10
            slot: BODY
        }
        serverSideCondition {
            type: request=Value
            value: STEP1
        }
    )

    region STEP2_CONTENT (
        name: Step 2 Content
        type: staticContent
        layout {
            sequence: 20
            slot: BODY
        }
        serverSideCondition {
            type: request=Value
            value: STEP2
        }
    )

    region STEP3_CONTENT (
        name: Step 3 Content
        type: staticContent
        layout {
            sequence: 30
            slot: BODY
        }
        serverSideCondition {
            type: request=Value
            value: STEP3
        }
    )

    region BUTTONS (
        name: Buttons
        type: staticContent
        layout {
            sequence: 40
            slot: REGION_POSITION_03
        }
    )
)
```

## Notes
- Keep step regions in `BODY` and drive their visibility with request-based conditions.
- Reuse the button permutations from `wizard-modal-dialog.buttons.md` inside a footer region hosted in `REGION_POSITION_03`.
- Ensure page processes, branches, progress content, and button requests use the same step identifiers.
