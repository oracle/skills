---
templateId: items.hidden.index
componentType: item
version: 1.0
imports:
  - hidden-item._common.md
description: Routing entrypoint for hidden-item variants.
---

# Purpose

Route `hidden-item` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `hidden-item._common.md`.
3. Load one variant file listed below.

# Variant Files
- `hidden-item.explicit-defaults.md`
- `hidden-item.minimal.md`
