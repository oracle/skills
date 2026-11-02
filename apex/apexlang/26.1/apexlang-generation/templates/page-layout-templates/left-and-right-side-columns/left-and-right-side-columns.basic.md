---
templateId: page.left-and-right-side-columns.basic
component: page
dslVersion: 1.0
imports:
  - left-and-right-side-columns._common.md
description: Baseline dual-rail page example with both left and right supporting columns.
---

## Purpose
Provide a baseline `@/left-and-right-side-columns` page example for pages that need persistent rails on both sides of the main content.

## Template
```apexlang
page 120 (
    name: Operations Console
    alias: OPERATIONS-CONSOLE
    title: Operations Console
    appearance {
        pageTemplate: @/left-and-right-side-columns
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

    region LEFT_RAIL (
        name: Left Rail
        type: staticContent
        layout {
            sequence: 10
            slot: REGION_POSITION_02
        }
    )

    region CONTENT (
        name: Content
        type: staticContent
        layout {
            sequence: 20
            slot: BODY
        }
    )

    region RIGHT_RAIL (
        name: Right Rail
        type: staticContent
        layout {
            sequence: 30
            slot: REGION_POSITION_03
        }
    )
)
```

## Notes
- Use the dual-rail layout only when both side areas are structurally important.
- Prefer a simpler page template when one rail is optional or empty most of the time.
