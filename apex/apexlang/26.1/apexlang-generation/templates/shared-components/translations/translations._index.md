---
templateId: shared-components.translations.index
componentType: shared-component
version: 1.0
imports:
  - translations._common.md
  - translations.text-messages._common.md
description: Canonical entrypoint for APEX text-message translation authoring and consumption patterns.
---

# Purpose

Document the complete APEX text-message translation flow in one family:
- define `textMessage` entries
- apply those message keys in component attributes

# Load Order

1. Load this file.
2. Load `translations._common.md` for terminology and guardrails.
3. Load `translations.text-messages._common.md` for the text-message authoring contract.
4. Load the `.example.md` files in this folder only when you need concrete syntax patterns.

# Canonical Files

- `translations.text-messages._common.md` — required fields, optional fields, and output skeleton for text-message authoring.
- `translations.text-messages.permutations.example.md` — representative message permutations across languages and field combinations.
- `translations.text-messages.consumption.example.md` — examples showing how components reference shared text-message keys.
- App/page localization runs emit `shared-components/messages.apx` and rewire user-facing component copy to substitutions such as `&APP_TEXT$KEY.`.

# Compiler-Validated Shape

- For full-application examples, use `app IDENTIFIER (` with a nested `name:` attribute, not `application (...)`.
- The accepted `textMessage` structure is the nested form validated against APEX 26.1:
  - `message { text: ... language: ... }`
  - optional `message { usedInJavaScript: true }`
  - optional `comments { comments: ... }`
- Emit `message.text` as a direct scalar value. Do not wrap `message.text` in fenced ````text` blocks.
- Do not use legacy top-level properties such as `staticId:` or a separate `attributes {}` block under `textMessage`.
- Treat `translations.text-messages.permutations.example.md` as the concrete syntax reference for authoring examples.

# Mental Model

- `globalization { translationMethod: textMessages }` turns on text-message translation for the application.
- Each `textMessage` block defines one localized value for a shared message key carried by the `textMessage` identifier itself.
- Components consume those shared message keys through substitution strings such as `&APP_TEXT$MESSAGE_KEY.`.
- Consumption examples belong to this family; they are not a separate translation subsystem.
- Plain-language requests such as `translate my app` or `make this page available in another language` should resolve to this model: create or reuse shared text-message keys, generate language variants, and rewire component text to substitutions.
- They must not be implemented by replacing component attributes with direct translated literals.
- Direct translated literals left in component attributes are a failed localization outcome.
