# Oracle APEX Translation Workflow Prompt

Default prompt scaffold for plain-language translation requests
- "Translate application `<App Alias or Name>`.
  language: `<language name or code>`
  scope: `<app | page | ask user>`
  page: `<page number or alias when scope is page>`
  auto_translate: true
  update_globalization_block: true
  log_path: `APEXLANG_OUTPUT_ROOT/logs/translations`
  Note: Convert user-facing literals into shared text-message keys and replace component copy with substitution references. Do not inline translated literals into labels, titles, help text, confirmations, breadcrumbs, or static content."

Canonical plain-language example
- Input: `Translate my app to Spanish`
- Output mode: `discovery`
- Artifact: `shared-components/messages.apx`
- Consumption: rewire translated page/component copy to `&APP_TEXT$...` substitutions

Simple follow-up prompts
- If scope is unclear, ask: "Do you want me to translate the whole app or just one page?"
- If the user chooses one page, ask: "Which page do you want me to translate?"

Explicit bundle scaffold
- "Translate text messages for application `<App Alias or Name>`.
  message_keys: [KEYS]
  source_text: [BASE STRINGS]
  languages: [fr, es, ...]
  auto_translate: false
  update_globalization_block: false
  log_path: `APEXLANG_OUTPUT_ROOT/logs/translations`
  Note: When target components are in scope, update them to substitutions rather than direct literals."

Usage notes
- Preserve placeholders, tokens, and markup exactly.
- For plain requests like `translate my app` or `add another language to this app`, start in discovery mode that converts user-facing literals into text-message keys instead of translating component copy in place.
- If the prompt explicitly asks for a page control such as a button/menu/selector, do not assume localization. Clarify whether the user wants runtime language switching or text-message localization.
- Ask for keys or source text only when the user is doing an explicit bundle update.
- Report Missing Inputs if the target language is missing or if explicit bundle inputs are incomplete.
- Do not finalize localization runs with direct translated literals left in translated component attributes.
- Do not generate helper source files for translation requests unless the user explicitly asked for tooling work.
