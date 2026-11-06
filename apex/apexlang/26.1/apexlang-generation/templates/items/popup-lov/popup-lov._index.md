---
templateId: items.popupLov.index
componentType: item
version: 1.0
imports:
  - popup-lov._common.md
description: Routing entrypoint for popup-lov variants.
---

# Purpose

Route `popup-lov` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `popup-lov._common.md`.
3. Load one variant file listed below.

# Variant Files
- `popup-lov.compact-template.md`
- `popup-lov.explicit-defaults.md`
- `popup-lov.lov-display-null.md`
- `popup-lov.lov-shared.md`
- `popup-lov.minimal.md`
- `popup-lov.width-placeholder.md`
