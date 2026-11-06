---
templateId: items.yesNo.index
componentType: item
version: 1.0
imports:
  - switch._common.md
description: Routing entrypoint for switch variants.
---

# Purpose

Route `switch` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `switch._common.md`.
3. Load one variant file listed below.

# Variant Files
- `switch.compact-template.md`
- `switch.explicit-defaults.md`
- `switch.minimal.md`
