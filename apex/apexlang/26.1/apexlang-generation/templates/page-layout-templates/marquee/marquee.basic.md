---
templateId: page.marquee.basic
component: page
dslVersion: 1.0
imports:
  - marquee._common.md
description: Baseline marquee page example with hero and body content regions.
---

## Purpose
Provide a baseline `@/marquee` page example for landing or dashboard-style experiences with a strong hero section.

## Template
```apexlang
page 140 (
    name: Executive Summary
    alias: EXECUTIVE-SUMMARY
    title: Executive Summary
    appearance {
        pageTemplate: @/marquee
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

    region HERO (
        name: Hero
        type: staticContent
        layout {
            sequence: 10
            slot: REGION_POSITION_07
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
- Add supporting regions in `REGION_POSITION_02` or `REGION_POSITION_03` only when they reinforce the marquee hierarchy.
- Keep overlays and launch surfaces in `REGION_POSITION_04`.
