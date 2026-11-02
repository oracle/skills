---
templateId: page.standard.basic
component: page
dslVersion: 1.0
imports:
  - standard._common.md
description: Baseline standard page example with title-bar and body regions.
---

## Purpose
Provide a baseline `@/standard` page example for general-purpose application pages.

## Template
```apexlang
page 10 (
    name: Dashboard
    alias: DASHBOARD
    title: Dashboard
    appearance {
        pageTemplate: @/standard
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

    region TITLE_BAR (
        name: Title Bar
        type: staticContent
        layout {
            sequence: 10
            slot: REGION_POSITION_01
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
)
```

## Notes
- Use `REGION_POSITION_08` only when content should break out of the standard body container.
- Add footer or utility regions only when the page information architecture calls for them.
