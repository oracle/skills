---
templateId: items.markdownEditor.index
componentType: item
version: 1.0
imports:
  - markdown-editor._common.md
description: Routing entrypoint for markdown-editor variants.
---

# Purpose

Route `markdown-editor` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `markdown-editor._common.md`.
3. Load one variant file listed below.

# Variant Files
- `markdown-editor.compact-template.md`
- `markdown-editor.explicit-defaults.md`
- `markdown-editor.minimal.md`
