---
templateId: shared-components.translations.common
componentType: shared-component
version: 1.0
description: Shared terminology and guardrails for APEX text-message translations.
---

# Purpose

Standardize terminology and guardrails for text-message translation generation and usage.

# Terminology

- `textMessage`: shared translation entry authored in APEXlang.
- `textMessage identifier`: the canonical message key after `textMessage`; reuse it across language variants of the same logical message.
- `message.text`: nested runtime text payload inside the `message {}` block.
- `message.language`: required language code inside the `message {}` block.
- `message.usedInJavaScript`: optional JavaScript-consumption flag inside the `message {}` block.
- `comments.comments`: optional builder note inside the `comments {}` block.
- message-key substitution: component-side reference such as `&APP_TEXT$MESSAGE_KEY.`.

# Guardrails

- Use one canonical vocabulary everywhere: `textMessage`, `message.text`, `message.language`, `message.usedInJavaScript`, and `comments.comments`.
- Keep the `textMessage` identifier stable across language variants.
- Do not append locale or language suffixes to the `textMessage` identifier; use `message.language` as the only language discriminator for translated `textMessage` blocks.
- For app/page localization workflows, user-facing component copy must be consumed through message-key substitutions backed by shared text messages.
- Do not satisfy localization requests by inlining translated literals directly into labels, titles, help text, confirmations, breadcrumbs, static content, or similar user-facing component attributes when a shared text message should be used.
- Omit optional fields rather than rendering empty placeholders.
- Treat `comments.comments` as builder-only notes, never runtime copy.
- Keep consumption examples focused on substitution usage; do not redefine the authoring contract there.
