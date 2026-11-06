# Workflow: Translations

Purpose
- Seed, review, and maintain text message translations using the canonical `shared-components/translations/` family while emitting `shared-components/messages.apx`.
- For plain-language localization asks such as `translate my app` or `make this app available in another language`, the expected outcome is text-message localization, not direct replacement of component copy with translated literals.
- Required output shape for app/page localization runs:
  - `shared-components/messages.apx`
  - `application.apx` with `globalization { translationMethod: textMessages }`
  - component rewiring to `&APP_TEXT$KEY.`
- If a prompt explicitly asks for a page control such as a button/menu/selector together with translation or language wording, do not auto-route here until runtime-switch versus localization intent is clarified.

Required inputs
- Discovery mode (default for plain-language prompts):
  - `target_app`: current app context or explicit app path / alias.
  - `language`: target locale name or code referencing translations.languages.json.
  - `scope`: `app` or `page`.
  - `page`: required only when `scope: page`.
  - Discovery mode means: find user-facing literals that must become shared text-message keys, generate localized message variants, and rewire component attributes to substitution syntax.
- Explicit-input mode (advanced):
  - `message_keys`: list of substitution string identifiers (e.g., `ADMINISTRATION`, `HELP`).
  - `source_text`: base language text for each key; HTML and placeholder tokens must remain intact.
  - `languages`: target locale codes referencing translations.languages.json.
  - `apply_to`: optional list of component references (page, region, item, button, static region) where the message key should replace hard-coded text.

Load
- references/policies/memory-bank/00-guard/ai.guard.md
- references/policies/memory-bank/10-global/apex.global.md
- references/policies/memory-bank/30-pages/apex.page.md (ensures substitution usage standards)

Assets
- assets/domains/shared-components/translations/languages.json — authoritative runtime language list.
- templates/shared-components/translations/translations._index.md — canonical translation entrypoint.
- templates/shared-components/translations/translations.text-messages._common.md — message authoring contract.
- templates/shared-components/translations/translations.text-messages.consumption.example.md — apply-to-components examples.
- assets/domains/shared-components/translations/prompts.json — prompt templates describing placeholder preservation requirements.

Options
- `auto_translate`: true by default for discovery mode. Record prompts used when AI assistance is active.
- `update_globalization_block`: true by default for discovery mode. Insert or verify `translationMethod: textMessages` and the configured runtime language derivation within application.apx.
- Default runtime language derivation for translation/localization runs is `languageDerivedFrom: browserPreference` unless the user explicitly requests a different derivation strategy.
- `scope_prompt_policy`: follow `assets/domains/shared-components/translations/default-config.json`; when scope is unclear, ask the configured simple-English question and do not invent scope.
- `log_path`: defaults to ``APEXLANG_OUTPUT_ROOT/logs/translations``; controls where prompt/response metadata is written for audit.
- Generated outputs for this workflow must stay within APEXlang artifacts plus standard workflow logs. Do not create helper source files unless the user explicitly requested tooling work.

Never do this
- Do not replace page titles, region names, labels, help text, breadcrumbs, `messages.whenNoDataFound`, confirmations, or static HTML with direct translated literals when the run is app/page localization.
- Do not treat `shared-components/messages.apx` as optional for app/page localization output.
- Do not leave the translated scope without `&APP_TEXT$...` substitutions.

Execution
- In discovery mode, identify hard-coded user-facing text from the targeted app or page, generate message keys, and replace targeted literals with text-message substitutions.
- Do not leave localized literals in labels, titles, help text, confirmations, breadcrumbs, static content, or similar user-facing component attributes when those values can be sourced from shared text messages.
- If a literal cannot be converted safely because the target location, source text, or key mapping is ambiguous, record Missing Inputs and block completion rather than emitting localized literals directly in the component.
- Updated `shared-components/messages.apx` with localized `textMessage` entries grouped by language, keeping placeholders and HTML identical to source.
- Emit `message.text` as a direct scalar `text: "..."` value inside each `textMessage`. Do not generate fenced ````text` blocks for `message.text`.
- Reuse the same translation message key across all language variants of a logical message; keep the `textMessage` identifier stable and let nested `message.language` distinguish variants.
- Optional patch to `application.apx` globalization block when requested.
  - When this workflow adds or updates the globalization block without an explicit user override, default to `languageDerivedFrom: browserPreference`.
- Translation log under `log_path/{artifact}-{timestamp}.json` capturing workflow inputs, prompts issued to LLMs, returned translations, manual notes, and any Missing Inputs.

Acceptance
- Plain-language translation requests pass only when user-facing component text is consumed through text-message substitutions and the translated payload lives in `textMessage` entries.
- Critique must hard-fail translation runs with:
  - `missing_messages_artifact`: app/page localization was in scope but `shared-components/messages.apx` was not emitted.
  - `missing_conversion`: user-facing literals were detected but not converted to message keys.
  - `invalid_consumption`: components still use direct text instead of substitution references.
  - `missing_globalization_setup`: translation artifacts exist but `translationMethod: textMessages` was not enabled when the app is intended to localize by text messages.
  - `non_apexlang_output`: the run generated non-APEXlang helper files without explicit user direction.

Completion
- After Revision, confirm or prompt for ``db_connection_name`, `app_path`, and `application_id`, run `references/ops/runtime-gates/02-direct-sqlcl-validate-gate.md`, then invoke `references/ops/runtime-gates/01-direct-sqlcl-import.md`.
- When `apply_to` is provided, ensure the relevant component definitions reference the substitution string (labels, titles, help text, static content, etc.).
