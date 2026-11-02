---
templateId: page.left-side-column.basic
component: page
dslVersion: 1.0
imports:
  - left-side-column._common.md
description: Baseline left-side-column page example with a persistent side rail.
---

## Purpose
Provide a baseline `@/left-side-column` page example for pages that need a persistent left rail.

## Template
```apexlang
page 110 (
    name: Worklist
    alias: WORKLIST
    title: Worklist
    appearance {
        pageTemplate: @/left-side-column
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

    region SIDE_RAIL (
        name: Side Rail
        type: staticContent
        layout {
            sequence: 10
            slot: leftColumn
        }
    )

    region CONTENT (
        name: Content
        type: staticContent
        layout {
            sequence: 20
            slot: body
        }
    )
)
```

## Notes
- Keep the left rail focused on contextual navigation, filters, or status.
- Use `@/standard` instead when the side rail is optional or mostly empty.
