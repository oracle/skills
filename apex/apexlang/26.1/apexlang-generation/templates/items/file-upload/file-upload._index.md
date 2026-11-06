---
templateId: items.fileUpload.index
componentType: item
version: 1.0
imports:
  - file-upload._common.md
description: Routing entrypoint for file-upload variants.
---

# Purpose

Route `file-upload` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `file-upload._common.md`.
3. Load one variant file listed below.

# Variant Files
- `file-upload.compact-template.md`
- `file-upload.explicit-defaults.md`
- `file-upload.minimal.md`
