---
templateId: page.wizard-modal-dialog.buttons
component: page
dslVersion: 1.0
imports:
  - wizard-modal-dialog._common.md
description: Button-strip permutations for wizard modal dialogs hosted in the footer region.
---

## Purpose
Provide button configuration patterns for wizard footer regions hosted in `REGION_POSITION_03`.

## Template
```apexlang
button PREVIOUS (
    buttonName: PREVIOUS
    label: Back
    layout {
        sequence: 10
        slot: PREVIOUS
    }
    appearance {
        buttonTemplate: @/text
        templateOptions: #DEFAULT#
    }
    behavior {
        warnOnUnsavedChanges: doNotCheck
    }
    serverSideCondition {
        type: requestIsNotContainedInValue
        value: STEP1
    }
)

button NEXT (
    buttonName: NEXT
    label: Next
    layout {
        sequence: 20
        slot: NEXT
    }
    appearance {
        buttonTemplate: @/text
        hot: true
        templateOptions: #DEFAULT#
    }
    behavior {
        warnOnUnsavedChanges: doNotCheck
    }
    serverSideCondition {
        type: requestIsContainedInValue
        value: STEP1:STEP2
    }
)

button FINISH (
    buttonName: FINISH
    label: Finish
    layout {
        sequence: 30
        slot: NEXT
    }
    appearance {
        buttonTemplate: @/text
        hot: true
        templateOptions: #DEFAULT#
    }
    behavior {
        warnOnUnsavedChanges: doNotCheck
    }
    serverSideCondition {
        type: request=Value
        value: STEP3
    }
)

button CANCEL (
    buttonName: CANCEL
    label: Cancel
    layout {
        sequence: 40
        slot: CANCEL
    }
    appearance {
        buttonTemplate: @/text
        templateOptions: #DEFAULT#
    }
    behavior {
        action: closeDialog
    }
)
```

## Notes
- Use these buttons inside a footer region anchored to `REGION_POSITION_03`.
- Adjust request values to match your wizard flow such as `STEP4` or `CONFIRM`.
- Keep wizard progress and button-state conditions aligned with the same request values.
