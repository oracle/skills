---
templateId: page.right-side-column.basic
component: page
dslVersion: 1.0
imports:
  - right-side-column._common.md
description: Baseline right-side-column page example with a supporting right rail.
---

## Purpose
Provide a baseline `@/right-side-column` page example for pages that need contextual content in a right rail.

## Template
```apexlang
page 170 (
    name: Record Review
    alias: RECORD-REVIEW
    title: Record Review
    appearance {
        pageTemplate: @/right-side-column
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

    region RIGHT_RAIL (
        name: Right Rail
        type: staticContent
        layout {
            sequence: 20
            slot: REGION_POSITION_03
        }
    )
)
```

## Notes
- Use the right rail for supporting details, actions, or inspector-style content.
- Keep the main page body dominant.
