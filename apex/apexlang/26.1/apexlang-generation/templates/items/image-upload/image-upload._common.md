---
templateId: items.imageUpload.common
componentType: item
version: 2.0
canonicalDslType: imageUpload
nativeType: NATIVE_IMAGE_UPLOAD
description: Canonical contract for image-upload item templates.
---

# Purpose

Define the canonical contract, conditional rules, and output skeleton for `image-upload` items.

---

# Generation Rules (MANDATORY)

1. Load `templates/items/items._common.md` first.
2. Load `references/policies/memory-bank/40-components/apex.items.md` before drafting final item DSL.
3. Use this family only for `imageUpload` semantics and remove attributes that belong to other item families.
4. Keep scenario overlays in the family templates and keep reusable contract details in this common file.
5. For compiler-valid 26.1 output, keep image-upload guidance to the generic page-item contract plus form binding fields that the compiler metadata still exposes. Do not emit stale upload-specific source metadata or stale item settings that the compiler no longer accepts for `imageUpload`.

---

# Variable Contract

| Name | Required | Type | Notes |
|---|---|---|---|
| itemName | yes | string | Page item static name such as `P10_STATUS`. |
| type | yes | enum | Must be `imageUpload`. |
| label.label | yes | string | Visible label text. |
| label.alignment | optional | enum | Label alignment when the label is shown. |
| layout.region | yes | alias | Host region static ID reference. |
| layout.sequence | yes | number | Rendering sequence within the region. |
| layout.slot | optional | enum | Region slot, typically `regionBody` for items rendered inside a host region. |
| layout.alignment | optional | enum | Item alignment inside the slot. |
| appearance.template | yes | alias | Family-appropriate template alias. |
| appearance.templateOptions | optional | array/string | Template modifiers such as `#DEFAULT#` or compact options. |
| validation.valueRequired | optional | boolean | Set when the item value is mandatory. |
| source.formRegion | conditional | alias | Required for form-bound image uploads. |
| source.column | conditional | string | Primary image payload column. |
| source.dataType | conditional | enum | Data type for the stored image payload, typically BLOB. |
| help.helpText | required by default | string | Builder help text or assistive guidance for visible user-facing image-upload items; omit only for hidden items or a documented exemption. |
| security.sessionStateProtection | optional | enum | Session state protection policy. |
| security.authorizationScheme | optional | alias | Authorization scheme alias when the item is conditionally visible. |

---

# Output Skeleton Template

```apexlang
pageItem {{itemName}} (
    type: imageUpload
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
- Do not emit legacy upload-only `settings {}` properties such as `storageType`, `displayAs`, `allowMultipleFiles`, `maxFileSize`, `displayDownloadLink`, `downloadLinkText`, `purgeFilesAt`, `dropzoneTitle`, `dropzoneDescription`, `maxWidth`, `maxHeight`, `allowCropping`, `aspectRatio`, `customAspectRatio`, `captureUsing`, or `previewSize` for `imageUpload`.
- Do not emit legacy `source.mimeTypeColumn`, `source.filenameColumn`, or `source.blobLastUpdatedColumn` for `imageUpload`.
- Emit `validation {}` only when the scenario requires declarative checks.
- Keep the item aligned with generic page-item and form-binding properties that remain compiler-backed for `imageUpload`.

---

# Guardrails

- Follow guardrails in `references/policies/memory-bank/00-guard/ai.guard.md`.
- Do not invent unsupported attributes or UT classes.
- Keep placeholder names aligned with `templates/items/items._common.md`.
- Validate the storage strategy and metadata column mappings before finalizing upload items.
- If a requested image-upload behavior depends on a property not covered here, query compiler-backed truth before emitting it.
