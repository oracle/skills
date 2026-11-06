---
templateId: items.checkbox.index
componentType: item
version: 1.0
imports:
  - checkbox._common.md
description: Routing entrypoint for checkbox variants.
---

# Purpose

Route `checkbox` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `checkbox._common.md`.
3. Load one variant file listed below.

# Variant Files
- `checkbox.columns.md`
- `checkbox.compact-template.md`
- `checkbox.explicit-defaults.md`
- `checkbox.lov-shared.md`
- `checkbox.minimal.md`
