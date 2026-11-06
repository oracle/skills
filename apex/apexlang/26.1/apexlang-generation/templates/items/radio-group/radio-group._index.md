---
templateId: items.radioGroup.index
componentType: item
version: 1.0
imports:
  - radio-group._common.md
description: Routing entrypoint for radio-group variants.
---

# Purpose

Route `radio-group` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `radio-group._common.md`.
3. Load one variant file listed below.

# Variant Files
- `radio-group.columns.md`
- `radio-group.compact-template.md`
- `radio-group.explicit-defaults.md`
- `radio-group.lov-shared.md`
- `radio-group.minimal.md`
