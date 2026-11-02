---
templateId: region.static-content.accordion
componentType: region
version: 1.0
imports:
  - static-content._common.md
  - static-content._nested-region._common.md
description: Accordion-style static content composition using variable-driven nested regions.
---

# Purpose

Accordion-style static content composition with variable-driven parent and child regions.

---

# Generation Rules (MANDATORY)

1. Load `static-content._common.md` and `static-content._nested-region._common.md` before use.
2. Keep HTML content, template aliases, and header/footer text variable-driven.
3. Keep server-side conditions optional and data-source safe.

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
  serverSideCondition {
    type: {{container.serverSideCondition.type}}
    sqlQuery:
      ```sql
      {{container.serverSideCondition.sqlQuery}}
      ```
  }
)

{{nestedRegions}}
```

---

# Conditional Rendering Rules

- Render `{{nestedRegions}}` using `static-content._nested-region._common.md`.
- Omit `serverSideCondition` when no gating condition is required.
