---
templateId: items.combobox.index
componentType: item
version: 1.0
imports:
  - combobox._common.md
description: Routing entrypoint for combobox variants.
---

# Purpose

Route `combobox` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `combobox._common.md`.
3. Load one variant file listed below.

# Variant Files
- `combobox.compact-template.md`
- `combobox.explicit-defaults.md`
- `combobox.lov-shared.md`
- `combobox.minimal.md`
- `combobox.width-placeholder.md`
