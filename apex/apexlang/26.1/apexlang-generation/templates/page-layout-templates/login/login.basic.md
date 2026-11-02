---
templateId: page.login.basic
component: page
dslVersion: 1.0
imports:
  - login._common.md
description: Baseline login page example with public authentication and a single login region.
---

## Purpose
Provide a baseline `@/login` example for the public application entry page.

## Template
```apexlang
page 9999 (
    name: Login
    alias: LOGIN
    title: Login
    appearance {
        pageTemplate: @/login
        templateOptions: #DEFAULT#
    }
    navigation {
        warnOnUnsavedChanges: false
    }
    security {
        authentication: public
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
    }

    region LOGIN_CONTENT (
        name: Login Content
        type: staticContent
        layout {
            sequence: 10
            slot: contentBody
        }
    )
)
```

## Notes
- Add header, footer, or background-image regions only when they support the authentication experience.
- Do not reuse this family for authenticated application pages.
