---
templateId: items.file-upload.explicit-defaults
componentType: item
version: 1.0
imports:
  - file-upload._common.md
description: file-upload variant explicit-defaults.
---

# Purpose

Scenario overlay for `file-upload` items focused on `explicit-defaults` behavior.

---

# Generation Rules (MANDATORY)

1. Load `file-upload._common.md` and `templates/items/items._common.md` before using this overlay.
2. Inherit the family contract and add only the scenario-specific placeholders listed below.
3. Remove blocks that are not required by the final prompt before finalizing the item DSL.

---

# Variable Contract

Inherits the full family contract from `file-upload._common.md`. Base family requirements such as `itemName`, `layout.region`, and `layout.sequence` still apply.

## Required Variables

- None beyond the inherited family contract.

## Optional Variables

- `label.alignment`
- `layout.slot`
- `layout.alignment`
- `appearance.templateOptions`
- `appearance.icon`
- `security.sessionStateProtection`
- `display.allowCopyPaste`
- `display.captureUsing`
- `storage.type`
- `storage.allowMultipleFiles`
- `storage.fileTypes`
- `storage.maxFileSize`

---

# Output Template

```apexlang
pageItem {{itemName}} (
    type: fileUpload
    label {
        label: {{label.label}}
        alignment: {{label.alignment}}
    }
    layout {
        sequence: {{layout.sequence}}
        region: @{{layout.region}}
        slot: {{layout.slot}}
        alignment: {{layout.alignment}}
    }
    appearance {
        template: {{appearance.template}}
        templateOptions: {{appearance.templateOptions}}
        icon: {{appearance.icon}}
    }
    display {
        displayAs: blockDropzone
        dropzoneTitle: Drop files here
        dropzoneDesc: or click to browse
        allowCopyPaste: {{display.allowCopyPaste}}
        captureUsing: {{display.captureUsing}}
    }
    storage {
        type: {{storage.type}}
        allowMultipleFiles: {{storage.allowMultipleFiles}}
        fileTypes: {{storage.fileTypes}}
        maxFileSize: {{storage.maxFileSize}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
    }
)
```

---

# Conditional Rendering Rules

- Show optional defaults only when the generator needs them visible in the final output.
- Always emit the `display {}` block. Keep its explicit `blockDropzone` defaults unless the user requests another supported mode or custom dropzone copy.
- Emit `storage {}` only when the generator needs those file-upload plugin attributes visible in the final output.
- Keep `storage.fileTypes` as one free-form comma-delimited text scalar and `storage.maxFileSize` as a positive integer number of KB.

---

# Guardrails

- Keep `file-upload._common.md` as the source of truth for reusable family rules.
- Keep placeholder names aligned with the inherited family contract.
- Do not reintroduce fixed demo wrappers, demo identifiers, or literal region names.
