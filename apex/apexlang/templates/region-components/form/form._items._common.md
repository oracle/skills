---
templateId: region.form.items.common
componentType: region
version: 1.0
imports:
  - form._common.md
description: Shared contract for form page items linked to a form region.
---

# Purpose

Standardize reusable form item blocks so scenario templates can render item definitions from variables instead of fixed demo items.

---

# Variable Contract

## Required Variables

- `items`

## Item Fields

- `item.staticId`
- `item.type`
- `item.region`
- `item.sequence`
- `item.slot` for items rendered in the form region body should be `regionBody`
- `item.source.column`
- `item.source.dataType`

## Required PK Item Fields

- `item.source.primaryKey: true` for every primary-key item mapped to a form region

## Optional Item Fields

- `item.label.*`
- `item.layout.*`
- `item.appearance.*`
- `item.validation.*`
- `item.lov.*`
- `item.security.*`

---

# Output Template – Item Block

```apexlang
pageItem {{item.staticId}} (
  type: {{item.type}}
  label {
    label: {{item.label.label}}
    alignment: {{item.label.alignment}}
  }
  layout {
    sequence: {{item.sequence}}
    region: @{{item.region}}
    slot: {{item.slot}}
    alignment: {{item.layout.alignment}}
  }
  appearance {
    template: {{item.appearance.template}}
    templateOptions: {{item.appearance.templateOptions}}
    width: {{item.appearance.width}}
  }
  validation {
    valueRequired: {{item.validation.valueRequired}}
  }
  lov {
    type: {{item.lov.type}}
    staticValues: {{item.lov.staticValues}}
  }
  source {
    formRegion: @{{item.region}}
    column: {{item.source.column}}
    dataType: {{item.source.dataType}}
    primaryKey: {{item.source.primaryKey}}
  }
  security {
    sessionStateProtection: {{item.security.sessionStateProtection}}
  }
)
```

---

# Conditional Rendering Rules

- Omit optional blocks when values are not provided.
- Do not emit `appearance.width` for item types whose schema forbids it; `displayOnly` supports only `appearance.template` and `appearance.templateOptions`.
- Do not emit page-item `settings` blocks; the current grammar does not expose a pageItem settings group.
- Keep each item mapped to exactly one form region via `item.region`.
- For items rendered inside the main form region body, emit `layout.slot: regionBody` instead of `BODY`.
- Every form region must have at least one source-mapped primary-key item; emit `primaryKey: true` on each PK item.
- Do not emit `primaryKey: false` for non-PK items; omit the property unless the item is a true primary key.
- Keep item static IDs, labels, and LOV values variable-driven.
- When visible item-template `templateOptions` are present, use the `static_id` values documented in `../../items/items._common.md`.
