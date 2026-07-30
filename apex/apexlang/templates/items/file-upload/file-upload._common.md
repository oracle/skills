---
templateId: items.fileUpload.common
componentType: item
version: 2.0
canonicalDslType: fileUpload
nativeType: NATIVE_FILE
description: Canonical contract for file-upload item templates.
---

# Purpose

Define the canonical contract, conditional rules, and output skeleton for `file-upload` items.

---

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` first.
2. Load `references/policies/memory-bank/40-components/apex.items.md` before drafting final item DSL.
3. Use this family only for `fileUpload` semantics and remove attributes that belong to other item families.
4. Keep scenario overlays in the family templates and keep reusable contract details in this common file.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Must be `fileUpload`. |
| label.label | yes | string | Visible label text. |
| label.alignment | optional | enum | Label alignment when the label is shown. |
| layout.region | yes | alias | Host region static ID reference. |
| layout.sequence | yes | number | Rendering sequence within the region. |
| layout.slot | optional | enum | Region slot, typically `regionBody` for items rendered inside a host region. |
| layout.alignment | optional | enum | Item alignment inside the slot. |
| appearance.template | yes | alias | Family-appropriate template alias. |
| appearance.templateOptions | optional | array/string | Template modifiers such as `#DEFAULT#` or compact options. |
| appearance.icon | optional | string | Font APEX icon class such as `fa-file`. |
| display.displayAs | yes | enum | Upload UI mode: `blockDropzone`, `inlineDropzone`, or `nativeFileBrowse`. Emit `blockDropzone` when the user does not request another supported mode. |
| display.dropzoneTitle | conditional | string | Required for dropzone modes; use `Drop files here` when custom copy is unavailable. |
| display.dropzoneDesc | conditional | string | Required for dropzone modes; use `or click to browse` when custom copy is unavailable. |
| display.allowCopyPaste | optional | boolean | Allows file copy/paste into supported dropzone UIs. |
| display.captureUsing | optional | enum | Device capture source: `selfieCamera` or `mainCamera`. Omit when no capture source is required. |
| storage.type | optional | enum | Proven storage type: `appTempFiles`. |
| storage.allowMultipleFiles | optional | boolean | Allows multiple files. |
| storage.fileTypes | optional | string | Free-form comma-delimited file type list such as `image/png,video/*`; do not emit as an array. |
| storage.maxFileSize | optional | number | Maximum file size in KB. |
| validation.valueRequired | optional | boolean | Set when the item value is mandatory. |
| source.formRegion | conditional | alias | Required for form-bound upload items. |
| source.column | conditional | string | Primary file payload column. |
| source.dataType | conditional | enum | Data type for the stored payload, typically BLOB. |
| help.helpText | required by default | string | Builder help text or assistive guidance for visible user-facing file-upload items; omit only for hidden items or a documented exemption. |
| security.sessionStateProtection | optional | enum | Session state protection policy. |
| security.authorizationScheme | optional | alias | Authorization scheme alias when the item is conditionally visible. |

---

# Output Skeleton Template

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
        displayAs: {{display.displayAs}}
        dropzoneTitle: {{display.dropzoneTitle}}
        dropzoneDesc: {{display.dropzoneDesc}}
        allowCopyPaste: {{display.allowCopyPaste}}
        captureUsing: {{display.captureUsing}}
    }
    storage {
        type: {{storage.type}}
        allowMultipleFiles: {{storage.allowMultipleFiles}}
        fileTypes: {{storage.fileTypes}}
        maxFileSize: {{storage.maxFileSize}}
    }
    validation {
        valueRequired: {{validation.valueRequired}}
    }
    source {
        formRegion: @{{source.formRegion}}
        column: {{source.column}}
        dataType: {{source.dataType}}
    }
    help {
        helpText: {{help.helpText}}
    }
    security {
        sessionStateProtection: {{security.sessionStateProtection}}
        authorizationScheme: @{{security.authorizationScheme}}
    }
)
```

---

# Conditional Rendering Rules

- Remove unsupported or unused blocks before finalizing the DSL.
- Omit `source {}` when the item is not bound to persisted data or a form region.
- Emit `validation {}` only when the scenario requires declarative checks.
- Always emit a grouped `display {}` block with an explicit `displayAs` value.
- Use `displayAs: blockDropzone` when the user does not request `inlineDropzone` or `nativeFileBrowse`.
- For dropzone modes, provide `dropzoneTitle` and `dropzoneDesc` when user-specific copy is available; otherwise emit `Drop files here` and `or click to browse`.
- Keep `storage.fileTypes` as one free-form comma-delimited text scalar, for example `image/png,video/*`.
- Keep `storage.maxFileSize` as a positive integer number of KB.

---

# Guardrails

- Follow guardrails in `references/policies/memory-bank/00-guard/ai.guard.md`.
- Do not invent unsupported attributes or UT classes.
- Keep placeholder names aligned with `templates/items/items._common.md`.
- Validate the storage strategy before finalizing upload items.
- Do not reintroduce legacy flat `settings.storageType`, `settings.displayAs`, or related file-upload settings.
