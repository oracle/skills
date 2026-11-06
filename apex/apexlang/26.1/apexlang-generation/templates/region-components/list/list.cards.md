---
templateId: region.list.cards
componentType: region
version: 1.0
imports:
  - list._common.md
description: Cards-style qualifier for list regions.
---

# Purpose

List-region variant that applies the cards list template appearance.

# Generation Rules (MANDATORY)

1. Load `list._common.md` first.
2. Use this variant when the generator qualifier is cards.

# Variable Contract

## Required Variables

- `qualifier`
- `componentAppearance.listTemplate`

# Output Template – Full

```apexlang
componentAppearance {
  listTemplate: @/cards
}
```

# Conditional Rendering Rules

- Keep cards-specific template options inside `componentAppearance`.
