---
templateId: items.textField.index
componentType: item
version: 1.0
imports:
  - text-field._common.md
description: Routing entrypoint for text-field variants.
---

# Purpose

Route `text-field` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `text-field._common.md`.
3. Load one variant file listed below.

# Variant Files
- `text-field.compact-template.md`
- `text-field.explicit-defaults.md`
- `text-field.minimal.md`
- `text-field.required-length.md`
- `text-field.width-placeholder.md`
