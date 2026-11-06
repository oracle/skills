---
templateId: region.form.rest-source
componentType: region
version: 1.0
imports:
  - form._common.md
  - form._items._common.md
  - form._processes._common.md
description: REST-backed form scenario using variable-driven item and process placeholders.
---

# Purpose

Form scenario for REST Data Source-backed forms with reusable item and process placeholders.

---

# Generation Rules (MANDATORY)

1. Load `form._common.md`, `form._items._common.md`, and `form._processes._common.md` before use.
2. Confirm the REST source supports required operations before enabling automatic DML.
3. Keep REST aliases, item mappings, and process wiring variable-driven.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `source.location` (use `restSource`)
- `source.restSource`
- `layout.sequence`
- `layout.slot`
- `appearance.template`
- `formItems` (from `form._items._common.md`)

## Optional Variables

- `appearance.templateOptions`
- `edit.*`
- `security.*`
- `formButtons`
- `formProcesses` (from `form._processes._common.md`)

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: form
  source {
    location: {{source.location}}
    restSource: @{{source.restSource}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: {{appearance.templateOptions}}
  }
  edit {
    enabled: {{edit.enabled}}
  }
  security {
    authorizationScheme: @{{security.authorizationScheme}}
  }
)

{{formItems}}

{{formButtons}}

{{formProcesses}}
```

---

# Conditional Rendering Rules

- Render `{{formItems}}` using `form._items._common.md`.
- Render `{{formProcesses}}` using `form._processes._common.md`.
- Omit optional blocks not required by the target REST implementation.
