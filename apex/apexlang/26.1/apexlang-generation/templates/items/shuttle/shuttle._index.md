---
templateId: items.shuttle.index
componentType: item
version: 1.0
imports:
  - shuttle._common.md
description: Routing entrypoint for shuttle variants.
---

# Purpose

Route `shuttle` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `shuttle._common.md`.
3. Load one variant file listed below.

# Variant Files
- `shuttle.compact-template.md`
- `shuttle.explicit-defaults.md`
- `shuttle.lov-shared.md`
- `shuttle.minimal.md`
