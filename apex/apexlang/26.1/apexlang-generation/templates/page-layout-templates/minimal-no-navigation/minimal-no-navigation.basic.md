---
templateId: page.minimal-no-navigation.basic
component: page
dslVersion: 1.0
imports:
  - minimal-no-navigation._common.md
description: Baseline minimal-no-navigation page example with a single focused content region.
---

## Purpose
Provide a baseline `@/minimal-no-navigation` example for focused tasks that should not show the standard application navigation chrome.

## Template
```apexlang
page 150 (
    name: Guided Task
    alias: GUIDED-TASK
    title: Guided Task
    appearance {
        pageTemplate: @/minimal-no-navigation
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
)
```

## Notes
- Use this template when the absence of navigation chrome is intentional.
- Switch to `@/standard` if the page starts needing broader application framing.
