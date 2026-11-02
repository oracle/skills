---
templateId: shared-components.translations.text-messages.common
componentType: shared-component
version: 1.0
imports:
  - translations._common.md
description: Canonical shared contract for authoring APEX text-message translations.
---

# Purpose

Define the variable contract and output skeleton for APEX applications that use `translationMethod: textMessages`.
For app/page localization runs, the generated text-message artifact is `shared-components/messages.apx`.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| application.name | yes | string | Application label rendered inside the top-level `app` block as the `name:` attribute. |
| application.alias | yes | string | Application identifier rendered after the `app` keyword. Use uppercase letters, digits, and underscores only. |
| application.translationMethod | yes | enum | Always `textMessages`. |
| messageBlocks | yes | list | One or more `textMessage` blocks. |
| messageBlocks[].staticId | yes | string | Canonical message identifier rendered after the `textMessage` keyword. Reuse across languages for the same logical message. |
| messageBlocks[].message.text | yes | string | Message content. This is the translatable payload and must render as a direct scalar `text: "..."` value inside the nested `message {}` block. |
| messageBlocks[].attributes.language | yes | string | Required language code for every message block, including the primary language. Render it as `language:` inside the nested `message {}` block. |
| messageBlocks[].attributes.usedInJavaScript | optional | boolean | Render it as `usedInJavaScript:` inside the nested `message {}` block only when the message is intended for `apex.lang.*` use in JavaScript. |
| messageBlocks[].comments.comments | optional | string or text block | Builder-only notes. Render inside the nested `comments {}` block. |

---

# Output Template – Full

```apex
app {{application.alias}} (
    name: {{application.name}}
    globalization {
        translationMethod: textMessages
    }
)

{{messageBlocks}}
```

```apex
textMessage {{messageBlocks[].staticId}} (
    message {
        text: "{{messageBlocks[].message.text}}"
        language: {{messageBlocks[].attributes.language}}
        usedInJavaScript: {{messageBlocks[].attributes.usedInJavaScript}}
    }
    comments {
        comments:
            ```text
            {{messageBlocks[].comments.comments}}
            ```
    }
)
```

---

# Authoring Rules

- Keep output variable-driven with `{{...}}` placeholders only; do not embed fixed sample values in the markdown contract.
- Expand `{{messageBlocks}}` into one or more `textMessage` blocks.
- Use the compiler-valid `app IDENTIFIER (...)` form for any top-level application wrapper examples.
- Render `globalization { translationMethod: textMessages }` when the application is explicitly using text-message translation.
- Emit the text-message payload into `shared-components/messages.apx` for app/page localization runs.
- Render `message.text` as a direct scalar value such as `text: "Save changes"`. Do not emit fenced ````text` blocks for `message.text`.
- Render `message.language` explicitly for every variant, including the primary language.
- Omit `message.usedInJavaScript` when false or not required.
- Omit the `comments {}` block when no builder note is needed.
- Keep the leading `textMessage` identifier stable for every language variant of the same logical message.
- Do not append the locale to the `textMessage` identifier. Language-specific variants must share one canonical message key and differ only by `message.language`.
- Use fenced text blocks only for `comments.comments` when multiline builder notes are needed.
- Do not add export-only internals such as `reference_id` or `version_scn`.
- Keep this contract focused on text-message authoring; translation application mappings and dynamic translations are out of scope.
- Do not treat direct translated literals in component attributes as acceptable localization output.
