---
templateId: region.help-text.common
componentType: region
version: 1.0
description: Shared contract for help-text regions and page help snippets.
---

# Purpose

Standardize inline help-text regions and optional page-level help content.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Help text region static id. |
| name | yes | string | Region name. |
| appearance.template | optional | string | Default to `@/standard` for inline help regions unless a documented shell is required. |
| headerAndFooter.headerText | optional | string | Optional region header. |
| headerAndFooter.footerText | optional | string | Optional region footer. |
| pageHelp.helpText | optional | string | Optional page-level help text. |
| textMessageKey | optional | string | Shared message key for translations. |

# Guardrails

- Keep inline help concise and actionable.
- Route reusable content through shared text messages when localization is required.
- Do not duplicate long guidance in both inline and page-level help unless explicitly requested.
- Use `appearance.template: @/standard` as the default help-region shell.
