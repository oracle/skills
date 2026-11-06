---
templateId: items.index
componentType: item
version: 1.0
description: Root router for item template families.
---

# Purpose

Route item-specific prompts to the correct item-family subfolder.

# Load Order

1. Load this file (`items._index.md`).
2. Load `items._common.md`.
3. Use `items._common.md` as the canonical source for visible item-template option IDs when the request changes `appearance.templateOptions`.
4. Load one target family entrypoint (`items._index.md` for multi-variant families, `standard.md` for single-variant families).
5. If present, load `items/<family>/_common.md`.
6. For multi-variant families, load one variant markdown file named `items/<family>/<family>.<variant>.md`.

# Routing Table

| Prompt intent | Family entrypoint |
|---|---|
| text field, input text, native input | `items/text-field/text-field._index.md` |
| text area, textarea | `items/text-area/text-area._index.md` |
| autocomplete, type-ahead text | `items/text-autocomplete/text-autocomplete._index.md` |
| select list | `items/select-list/select-list._index.md` |
| select one | `items/select-one/standard.md` |
| select many, multi select, multi-select chips/list | `items/select-many/standard.md` |
| combobox | `items/combobox/combobox._index.md` |
| checkbox | `items/checkbox/checkbox._index.md` |
| radio group | `items/radio-group/radio-group._index.md` |
| shuttle | `items/shuttle/shuttle._index.md` |
| switch, yes/no | `items/switch/switch._index.md` |
| star rating | `items/star-rating/standard.md` |
| date picker | `items/date-picker/date-picker._index.md` |
| number field | `items/number-field/number-field._index.md` |
| color picker | `items/color-picker/standard.md` |
| hidden item | `items/hidden-item/hidden-item._index.md` |
| display only | `items/display-only/standard.md` |
| file upload | `items/file-upload/file-upload._index.md` |
| rich text editor | `items/rich-text-editor/rich-text-editor._index.md` |
| image upload | `items/image-upload/image-upload._index.md` |
| popup lov | `items/popup-lov/popup-lov._index.md` |
| list manager | `items/list-manager/list-manager._index.md` |
| markdown editor | `items/markdown-editor/markdown-editor._index.md` |

# Guardrails

- Do not route to removed root-level `items/*.md` shim files.
- Always route page-item-specific asks directly to the matching family entrypoint (`items._index.md` or `standard.md`).
- Keep family folder names in lowercase kebab-case.
- Use `items._common.md` as the canonical source for valid visible item-template option IDs.
