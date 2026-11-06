# Workflow: Translations — Batch Apply

Purpose
- Apply a bundle of APEX text message translations across multiple languages and keys in one run while respecting placeholder discipline.
- Treat whole-app or page-level localization asks as batch text-message conversion work, not as permission to inline translated literals throughout component definitions.
- Required output shape for app/page localization runs:
  - `shared-components/messages.apx`
  - `application.apx` with `globalization { translationMethod: textMessages }`
  - component rewiring to `&APP_TEXT$KEY.`

Required inputs
- Discovery mode for app/page translation intents:
  - `target_app`: current app context or explicit app path / alias.
  - `language`: target locale name or code.
  - `scope`: `app` or `page`.
  - `page`: required only when `scope: page`.
  - Discovery mode means scanning the requested scope for user-facing literals that must be converted into shared text-message keys and component substitution references.
- Explicit bundle mode:
  - `operation`: replace | merge | append (default `replace`).
  - `translation_bundle`: object keyed by message key → language code → translated text.
  - `fallback_language`: default source language when a translation is missing.
  - `languages`: list of language codes to confirm coverage (optional when bundle enumerates all languages).
  - `targets`: optional list mapping message keys to component references (page/region/item/button/static region).
  - Optional single-target convenience input: `target` (same structure as one `targets` entry; normalized to a one-item list).
  - Backward compatibility: accept `apply_to` and normalize it to `targets`.
  - `auto_translate`: optional flag to request AI assistance for missing entries.
  - `log_path`: optional override for translation logs.

Clarify — progressive prompts
- If the prompt explicitly asks for a page control such as a button/menu/selector together with translation or language wording, ask whether the user wants runtime language switching or text-message localization before continuing.
- If the user intent is translation but scope is unclear, ask in simple English: `Do you want me to translate the whole app or just one page?`
- If page scope is chosen, ask in simple English: `Which page do you want me to translate?`
- Confirm the number of keys and languages contained in the bundle only when the user supplied a bundle.
- Validate that every translation preserves placeholder tokens (e.g., `#USER#`, `&APP_NAME.`).
- For AI-assisted fills, confirm which languages require machine translation and whether manual review is needed before finalizing.
- For each key, confirm whether existing messages should be replaced, merged, or appended (defaults to `operation: replace`).

Never do this
- Do not replace page titles, region names, labels, help text, breadcrumbs, `messages.whenNoDataFound`, confirmations, or static HTML with direct translated literals when the run is app/page localization.
- Do not treat `shared-components/messages.apx` as optional for app/page localization output.
- Do not leave the translated scope without `&APP_TEXT$...` substitutions.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- assets/domains/shared-components/translations/languages.json (language definitions)
- assets/domains/shared-components/translations/prompts.json (placeholder guidance)
- templates/shared-components/translations/translations._index.md
- templates/shared-components/translations/translations.text-messages._common.md
- templates/shared-components/translations/translations.text-messages.consumption.example.md
- Tier 1 single translation workflow `references/domains/shared-components/workflow-translations.md`

Execution model
- Normalize `target`/`apply_to` -> `targets`.
- In discovery mode, scan the targeted app or page for user-facing literals, derive message keys, and construct a generated translation bundle before applying updates.
- Discovery mode must produce both:
  - shared `textMessage` entries for the requested language variants
  - component rewiring so titles, labels, help text, confirmations, breadcrumbs, and static content consume substitutions instead of literal translated text
- When discovery mode adds or updates the application globalization block and the user did not specify a derivation strategy, default to `languageDerivedFrom: browserPreference`.
- Iterate through each message key in the bundle.
  - For each language in `languages` (or bundle keys), invoke the single translation workflow with the provided text.
  - Record Missing Inputs when a translation is absent and `auto_translate` is false.
  - When `auto_translate` true, call the translation prompt, log prompts/responses, and mark the entry as AI-generated.
  - When `targets` includes component references, schedule updates to those components (labels, titles, help text, static content) to reference the substitution string.
- Update `shared-components/messages.apx` entries grouped by language.
- Keep one canonical message key per translation across all variants; keep the `textMessage` identifier stable and use nested `message.language` as the only language discriminator.
- Do not ship app/page localization runs with direct translated literals left in user-facing component attributes when those attributes are in scope for translation.
- Do not generate helper source files or other non-APEXlang artifacts unless the user explicitly asked for tooling work.
- Maintain a consolidated change log and translation log for audit.

Completion
- Revision writes updated shared-components/messages.apx, updates referenced components (pages/regions/items/buttons/static HTML) to use substitution strings, and applies any globalization block changes requested.
- Unless the user explicitly overrides the derivation mode, globalization changes emitted by this workflow should use `languageDerivedFrom: browserPreference`.
- Logs stored under `log_path` with batch identifier, `operation`, and timestamp.

Notes
- Batch workflow orchestrates single-key translation updates; it does not introduce new templates.
- Enforce placeholder preservation: critique must fail if HTML tokens or substitution strings differ.
- Critique must hard-fail `missing_messages_artifact` when app/page localization is in scope and `shared-components/messages.apx` is missing.
- Critique must also hard-fail `missing_conversion`, `invalid_consumption`, and `missing_globalization_setup` for app/page localization runs when applicable.
- Critique must hard-fail `non_apexlang_output` when the run emits unrelated helper files.
- Provide summary output listing keys/languages processed, missing translations, and AI-assisted entries.
