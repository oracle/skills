---
templateId: region.static-content.blank-with-attributes
componentType: region
version: 1.0
imports:
  - static-content._common.md
  - static-content._nested-region._common.md
description: Blank static-content container with variable-driven nested children.
---

# Purpose

Blank container scenario for composing nested static regions from variables.

---

# Generation Rules (MANDATORY)

1. Load `static-content._common.md` and `static-content._nested-region._common.md` before use.
2. Keep container and child region IDs, names, and templates variable-driven.
3. Remove optional attributes that are not required by the page design.

---

# Output Template – Full

```apexlang
region {{container.staticId}} (
  name: {{container.name}}
  type: staticContent
  layout {
    sequence: {{container.layout.sequence}}
    slot: {{container.layout.slot}}
    startNewRow: {{container.layout.startNewRow}}
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
