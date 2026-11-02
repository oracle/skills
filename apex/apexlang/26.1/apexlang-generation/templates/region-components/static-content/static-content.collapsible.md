---
templateId: region.static-content.collapsible
componentType: region
version: 1.0
imports:
  - static-content._common.md
  - static-content._nested-region._common.md
description: Collapsible static-content composition using variable-driven nested regions.
---

# Purpose

Collapsible static-content scenario using parent/child contracts and optional header/footer placeholders.

---

# Generation Rules (MANDATORY)

1. Load `static-content._common.md` and `static-content._nested-region._common.md` before use.
2. Keep template aliases, content, and text variable-driven.
3. Omit optional blocks when not required.

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
