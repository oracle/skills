---
templateId: items.autoComplete.index
componentType: item
version: 1.0
imports:
  - text-autocomplete._common.md
description: Routing entrypoint for text-autocomplete variants.
---

# Purpose

Route `text-autocomplete` requests to the correct variant markdown file.

# Load Order

1. Load this file.
2. Load `text-autocomplete._common.md`.
3. Load one variant file listed below.

# Variant Files
- `text-autocomplete.compact-template.md`
- `text-autocomplete.explicit-defaults.md`
- `text-autocomplete.lov-shared.md`
- `text-autocomplete.minimal.md`
- `text-autocomplete.required-length.md`
- `text-autocomplete.width-placeholder.md`
