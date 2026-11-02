---
templateId: region.static-content.collection-toolbar
componentType: region
version: 1.0
imports:
  - static-content._common.md
  - static-content._nested-region._common.md
description: Collection-toolbar style composition using variable-driven static-content contracts.
---

# Purpose

Collection toolbar scenario for static content built from variable-driven parent and nested contracts.

---

# Generation Rules (MANDATORY)

1. Load `static-content._common.md` and `static-content._nested-region._common.md` before use.
2. Keep template aliases, names, and nested layout attributes variable-driven.
3. Remove any optional blocks that are not needed.

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
