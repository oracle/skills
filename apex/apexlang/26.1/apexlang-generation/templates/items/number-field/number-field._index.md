---
templateId: items.numberField.index
componentType: item
version: 1.0
imports:
  - number-field._common.md
description: Routing entrypoint for number-field variants.
---

# Purpose

Route `number-field` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `number-field._common.md`.
3. Load one variant file listed below.

# Variant Files
- `number-field.compact-template.md`
- `number-field.explicit-defaults.md`
- `number-field.format-mask.md`
- `number-field.minimal.md`
- `number-field.width-placeholder.md`
