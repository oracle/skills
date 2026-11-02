---
templateId: region.static-content.buttons
componentType: region
version: 1.0
imports:
  - static-content._common.md
  - static-content._button._common.md
description: Static-content host region with variable-driven button actions.
---

# Purpose

Host static-content region for rendering configurable action buttons.

---

# Generation Rules (MANDATORY)

1. Load `static-content._common.md` and `static-content._button._common.md` before use.
2. Keep button identifiers, labels, and actions variable-driven.
3. Remove optional button blocks that are not required by the scenario.
4. The host region does not own icon placement; apply left/right icon-position defaults on each generated button through `static-content._button._common.md`.

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

{{buttons}}
```

---

# Conditional Rendering Rules

- Render `{{buttons}}` using `static-content._button._common.md`.
- Do not add icon-position classes or template options to the container region itself.
