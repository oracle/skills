---
templateId: region.collapsible.common
componentType: region
version: 1.0
description: Shared contract for collapsible region behavior.
---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Region static id. |
| type | yes | enum | Usually `staticContent` for this pattern. |
| appearance.template | yes | ref | Collapsible-capable template. |
| appearance.templateOptions | optional | array | Use the accepted values from `collapsible-region._template_options.md`, including `collapsed` for initial collapsed state. Keep `#DEFAULT#` standalone when present and do not substitute emitted CSS class strings. |

# Guardrails

- Use only the documented `static_id` values in `collapsible-region._template_options.md`.
- Include `collapsed` only when initial collapsed state is desired.
- Never concatenate `#DEFAULT#` with another template-option value.
