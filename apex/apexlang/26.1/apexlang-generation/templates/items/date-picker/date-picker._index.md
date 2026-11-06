---
templateId: items.datePicker.index
componentType: item
version: 1.0
imports:
  - date-picker._common.md
description: Routing entrypoint for date-picker variants.
---

# Purpose

Route `date-picker` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `date-picker._common.md`.
3. Load one variant file listed below.

# Variant Files
- `date-picker.compact-template.md`
- `date-picker.date-format.md`
- `date-picker.explicit-defaults.md`
- `date-picker.minimal.md`
- `date-picker.width-placeholder.md`
