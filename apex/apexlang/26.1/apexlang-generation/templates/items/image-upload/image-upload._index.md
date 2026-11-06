---
templateId: items.imageUpload.index
componentType: item
version: 1.0
imports:
  - image-upload._common.md
description: Routing entrypoint for image-upload variants.
---

# Purpose

Route `image-upload` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `image-upload._common.md`.
3. Load one variant file listed below.

# Variant Files
- `image-upload.compact-template.md`
- `image-upload.explicit-defaults.md`
- `image-upload.minimal.md`
