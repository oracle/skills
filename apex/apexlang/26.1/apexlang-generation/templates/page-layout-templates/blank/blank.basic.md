---
templateId: page.blank.basic
component: page
dslVersion: 1.0
imports:
  - blank._common.md
description: Baseline blank page example with a single body region.
---

## Purpose
Provide a minimal `@/blank` example for utility pages, embedded views, or lightweight task flows.

## Template
```apexlang
page 40 (
    name: Utility Surface
    alias: UTILITY-SURFACE
    title: Utility Surface
    appearance {
        pageTemplate: @/blank
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
)
```

## Notes
- Keep launched overlays in `REGION_POSITION_04` rather than mixing them into the body region.
- Move to `@/standard` or another family when the page needs breadcrumb, footer, or side-rail chrome.
