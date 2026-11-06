---
templateId: region.static-content.cards
componentType: region
version: 1.0
imports:
  - static-content._common.md
  - static-content._nested-region._common.md
description: Cards composition with variable-driven parent and child regions.
---

# Purpose

Cards-oriented static-content scenario using variable-driven nested region contracts.

---

# Generation Rules (MANDATORY)

1. Load `static-content._common.md` and `static-content._nested-region._common.md` before use.
2. Keep card templates, HTML, and template options variable-driven.
3. Move fixed examples to references; keep executable output template contract-only.

---

# Output Template – Full

```apexlang
region {{container.staticId}} (
  name: {{container.name}}
  type: staticContent
  layout {
    sequence: {{container.layout.sequence}}
    slot: {{container.layout.slot}}
  }
  appearance {
    template: {{container.appearance.template}}
    templateOptions: {{container.appearance.templateOptions}}
  }
)

{{nestedRegions}}
```

---

# Conditional Rendering Rules

- Render `{{nestedRegions}}` using `static-content._nested-region._common.md`.
