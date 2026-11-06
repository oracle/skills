---
templateId: items.richTextEditor.index
componentType: item
version: 1.0
imports:
  - rich-text-editor._common.md
description: Routing entrypoint for rich-text-editor variants.
---

# Purpose

Route `rich-text-editor` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `rich-text-editor._common.md`.
3. Load one variant file listed below.

# Variant Files
- `rich-text-editor.compact-template.md`
- `rich-text-editor.explicit-defaults.md`
- `rich-text-editor.minimal.md`
