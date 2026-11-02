---
templateId: page.login
component: page
dslVersion: 1.0
description: Public-facing login page layout with dedicated header, footer, and background slots.
---

## Purpose
Apply the shared non-dialog page contract to the Theme 42 `Login` page template. Use this layout for authentication entry points and other public pages that need login-style chrome.

## Variables
| Name | Required | Type | Description |
|------|----------|------|-------------|
| pageNumber | yes | number | Page identifier; current examples commonly use a dedicated login page such as `9999`. |
| name | yes | string | Page name. |
| alias | yes | string | Page alias, often `LOGIN`. |
| title | optional | string | Browser and page title. |
| appearance.pageTemplate | yes | string | Must be `@/login`. |
| appearance.templateOptions | optional | string or array | Usually `#DEFAULT#`, `background-1`, `background-2`, `background-3`, or `split`; use the `static_id` values from the inventory in [`../README.md`](../README.md). |
| security.authentication | usually yes | enum | Commonly `public` for login entry pages. |
| layout slots | derived | slot set | `BACKGROUND_IMAGE` (`backgroundImage`), `BODY` (`contentBody`), `REGION_POSITION_01` (`bodyHeader`), `REGION_POSITION_02` (`bodyFooter`), `AFTER_HEADER` (`afterHeader`), `BEFORE_FOOTER` (`beforeFooter`). |

## Template
```apexlang
page [pageNumber] (
    name: [name]
    alias: [alias]
    title: [title]
    appearance {
        pageTemplate: @/login
        templateOptions: [appearance.templateOptions]
    }
    navigation {
        warnOnUnsavedChanges: false
    }
    security {
        authentication: public
        pageAccessProtection: [security.pageAccessProtection]
        formAutoComplete: false
    }

    region loginContent (
        name: [loginRegionName]
        type: [loginRegionType]
        layout {
            sequence: 10
            slot: contentBody
        }
    )
)
```

## Slot Guidance
- `BODY` / `contentBody`: Main login content such as the login region or explanatory content.
- `REGION_POSITION_01` / `bodyHeader`: Header content above the main login body.
- `REGION_POSITION_02` / `bodyFooter`: Footer content below the main login body.
- `AFTER_HEADER` / `afterHeader`: Supplemental content immediately below the page header.
- `BEFORE_FOOTER` / `beforeFooter`: Supplemental content immediately above the page footer.
- `BACKGROUND_IMAGE` / `backgroundImage`: Background artwork or media region.

## Conditional Rules
- Keep the page public if it is the application login entry point.
- Use conditions on supplemental header or footer regions when the page supports multiple auth scenarios.

## Guardrails
- Do not reuse this template for authenticated application pages just to get the visual treatment.
- Keep background-image usage accessible and non-essential to the task flow.

## Source Anchors
- `core/themes/theme_42/f8842.261/application/shared_components/user_interface/templates/page/login.sql`
- Internal template-source metadata (`page-login`)
