---
templateId: items.listManager.index
componentType: item
version: 1.0
imports:
  - list-manager._common.md
description: Routing entrypoint for list-manager variants.
---

# Purpose

Route `list-manager` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `list-manager._common.md`.
3. Load one variant file listed below.

# Variant Files
- `list-manager.compact-template.md`
- `list-manager.explicit-defaults.md`
- `list-manager.lov-shared.md`
- `list-manager.minimal.md`
