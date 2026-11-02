---
templateId: items.selectList.index
componentType: item
version: 1.0
imports:
  - select-list._common.md
description: Routing entrypoint for select-list variants.
---

# Purpose

Route `select-list` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `select-list._common.md`.
3. Load one variant file listed below.

# Variant Files
- `select-list.compact-template.md`
- `select-list.explicit-defaults.md`
- `select-list.lov-display-null.md`
- `select-list.lov-shared.md`
- `select-list.minimal.md`
