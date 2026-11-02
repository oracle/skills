---
templateId: region.region-display-selector.standard
componentType: region
version: 1.0
imports:
  - region-display-selector._common
description: Standard RDS controller with two explicitly selected content regions.
---

# View Single Region Pattern

This data-free example uses two static content regions so it introduces no database-object assumptions.

```apexlang
page 10 (
    name: Region Display Selector
    alias: REGION-DISPLAY-SELECTOR
    title: Region Display Selector
    appearance {
        pageTemplate: @/standard
        templateOptions: #DEFAULT#
    }
    security {
        authorizationScheme: mustNotBePublicUser
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
    }

    region section_selector (
        name: Section Selector
        type: regionDisplaySelector
        layout {
            sequence: 10
            slot: body
        }
        appearance {
            template: @/blank-with-attributes-no-grid
            templateOptions: #DEFAULT#
        }
        settings {
            mode: viewSingleRegion
            displayRegionIcons: true
            includeShowAll: true
            rememberSelection: byUser
        }
        advanced {
            htmlDomId: section-selector
        }
    )

    region summary (
        name: Summary
        type: staticContent
        source {
            htmlCode: Review the current summary.
        }
        layout {
            sequence: 20
            slot: body
        }
        appearance {
            template: @/standard
            templateOptions: #DEFAULT#
            icon: fa-list
        }
        advanced {
            htmlDomId: summary
            regionDisplaySelector: true
        }
    )

    region details (
        name: Details
        type: staticContent
        source {
            htmlCode: Review the current details.
        }
        layout {
            sequence: 30
            slot: body
        }
        appearance {
            template: @/standard
            templateOptions: #DEFAULT#
            icon: fa-table
        }
        advanced {
            htmlDomId: details
            regionDisplaySelector: true
        }
    )
)
```

# Required Behavior

- Do not add `advanced.regionDisplaySelector` to `section_selector`.
- The `summary` and `details` layout sequences determine their tab order.
- If icons are disabled, the controlled regions may omit `appearance.icon`.
- Do not use RDS selection as an authorization or server-side-condition replacement.
