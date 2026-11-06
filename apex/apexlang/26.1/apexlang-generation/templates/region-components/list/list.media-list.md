---
templateId: region.list.media-list
componentType: region
version: 1.0
imports:
  - list._common.md
description: Media-list qualifier for list regions.
---

# Purpose

List-region variant that applies the media-list list template appearance.

# Generation Rules (MANDATORY)

1. Load `list._common.md` first.
2. Use this variant when the generator qualifier is media list.

# Variable Contract

## Required Variables

- `qualifier`
- `componentAppearance.listTemplate`

# Output Template – Full

```apexlang
componentAppearance {
  listTemplate: @/media-list
}
```

# Conditional Rendering Rules

- Keep media-list-specific template options inside `componentAppearance`.
