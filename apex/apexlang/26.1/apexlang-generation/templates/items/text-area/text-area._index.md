---
templateId: items.textarea.index
componentType: item
version: 1.0
imports:
  - text-area._common.md
description: Routing entrypoint for text-area variants.
---

# Purpose

Route `text-area` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `text-area._common.md`.
3. Load one variant file listed below.

# Variant Files
- `text-area.compact-template.md`
- `text-area.explicit-defaults.md`
- `text-area.minimal.md`
- `text-area.required-length.md`
- `text-area.width-placeholder.md`
