# APEX Help Text — Reusable Prompts

This guide standardizes prompt inputs to request, preview, and validate help text across APEX components.

## 1. Page-level help
- Prompt scaffold:
  - "Provide page help for `<PAGE>` using Text Message `<TM_KEY>`; summarize purpose and required steps."

## 2. Item inline help
- Prompt scaffold:
  - "Draft inline help for `<ITEM>` describing acceptable input. Use TM `<TM_KEY>`."

## 3. Item detailed help dialog
- Prompt scaffold:
  - "Provide detailed help text for `<ITEM>` explaining validation/dependencies. Use TM `<TM_KEY>`."

## Checklist
- Prefer Text Messages/shared components (avoid hard-coded literals).
- Inline help <= 60 chars; detailed help <= 400 chars unless governance changes.
- Avoid PII/secrets and avoid decorative HTML unless template requires it.

For structured preview payload conventions, follow workflow and template contracts.
