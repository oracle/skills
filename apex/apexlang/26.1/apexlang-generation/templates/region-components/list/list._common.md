---
templateId: region.list.common
componentType: region
version: 1.0
description: Shared contract for list regions.
---

# Purpose

Document the native list region shell and qualifier-dependent list-template appearance.

# Generation Rules (MANDATORY)

1. Use the dedicated `region-list` template.
2. Treat the qualifier as mandatory design intent: `cards` or `mediaList`.
3. Keep the list shared-component reference in the source block.
4. When the qualifier is `mediaList`, align the report-level appearance values with `../../template-components/media-list/media-list._template_options.md`, plus the shared `../../template-components/avatar/avatar._template_options.md` and `../../template-components/badge/badge._template_options.md` owner files.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Region identifier. |
| name | yes | string | Display name. |
| source.listReference | yes | string | Shared list alias. |
| qualifier | yes | enum | `cards` or `mediaList`. |

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: list
  source {
    list: @{{source.listReference}}
  }
)
```

# Conditional Rendering Rules

- Pick exactly one qualifier file per region.
- Keep list-template appearance settings inside `componentAppearance`.

# Guardrails

- Metadata export lookup: search for `List`, `Cards`, `Media List`, and the selected list-template alias.
