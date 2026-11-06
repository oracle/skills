---
templateId: region.form.processes.common
componentType: template
version: 1.0
imports:
  - form._common.md
description: Shared process linkage contract for form scenario templates.
---

# Purpose

Keep process placeholders explicit and reusable across form scenarios while process implementation details stay in business-logic templates.

---

# Variable Contract

## Optional Variables

- `processes.formInitialization`
- `processes.automaticRowProcessing`
- `processes.additional`

---

# Output Template – Process Placeholders

```apexlang
{{processes.formInitialization}}
{{processes.automaticRowProcessing}}
{{processes.additional}}
```

---

# Conditional Rendering Rules

- Render placeholders only when corresponding process templates are required.
- Use `business-logic/processes/*` templates for executable process blocks.
