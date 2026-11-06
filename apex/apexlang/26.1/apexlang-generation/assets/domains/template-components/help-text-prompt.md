# APEX Help Text — Reusable Prompts

This guide standardizes how AI tooling requests, previews, and validates help text across Oracle APEX components.

## 1. Page-Level Help
- **Intent:** Populate the page Help dialog (accessible via the theme menu).
- **Inputs to collect:** source (column comment/text message key), audience, translation needs.
- **Prompt scaffold:**
  - “Provide page help for `<PAGE>` using Text Message `<TM_KEY>`; summarize purpose and required steps.”
- **Preview format:**
```
Summary: Page-level help for HOME (TM: APP.PAGE.HOME)
- Intent: Explain Home dashboard layout and available shortcuts.
- Help Text:
  Home aggregates department KPIs, pending approvals, and quick links.
  Use the action buttons to navigate to detailed reports.
- Note: Content references Text Message APP.PAGE.HOME for localization.
```

## 2. Item-Level Inline Help
- **Intent:** Provide a concise hint beneath the item label.
- **Inputs:** item name, data type, validation requirements, length (~3–6 words).
- **Prompt scaffold:**
  - “Draft inline help for `<ITEM>` so users know acceptable input (max 40 chars). Use TM `<TM_KEY>`.”
- **Preview:**
```
Summary: Inline help for P1_CB_SS (TM: ITEM.P1_CB_SS.INLINE)
- Intent: Remind users to pick a preset value or reveal manual entry.
- Inline Help: Choose a preset or open manual entry.
- Note: Short hint; no HTML.
```

## 3. Item-Level Detailed Help Dialog
- **Intent:** Show detailed instructions when users click field help icon.
- **Inputs:** item name, business rule, example values, translation key.
- **Prompt scaffold:**
  - “Provide detailed help text for `<ITEM>` explaining validation and sources. Use TM `<TM_KEY>`.”
- **Preview:**
```
Summary: Help dialog for P1_CB_SS (TM: ITEM.P1_CB_SS.HELP)
- Intent: Explain combobox usage and manual-entry workflow.
- Help Text:
  Use the dropdown to pick a standard option. If the value isn’t listed,
  click Manual Entries and provide the request code supplied by operations.
  Required fields are marked with *. Values sync to the Ordering API.
- Note: Reviewed for length (<400 chars); uses Text Message ITEM.P1_CB_SS.HELP.
```

## 4. Help Text Checklist (apply to every prompt)
- Reference Text Messages/shared components (no hard-coded literals).
- Keep inline help ≤ 60 characters; detailed help ≤ 400 characters unless justified.
- Avoid repeating label text; focus on “why/how”.
- Mention related validation or dependencies (e.g., item must exist before manual entries).
- Strip HTML unless the template explicitly supports it.
- Confirm translation keys exist or schedule them via translation workflow.

- For the structured preview JSON used by help-text batches, see `templates/region-components/help-text/help-text.standard.md` (section D).

## 6. Guardrail Fail Example
```
Summary: Proposed inline help rejected
- Intent: Clarify acceptable date range.
- Proposed Text: “Enter valid date plz!!!”
- Violations:
  - Informal language.
  - No Text Message reference.
  - Fails length/clarity requirements.
- Action: Reject and request corrected input.
```

---

Pair these prompts with the forthcoming Help Text Batch Workflow to gather, preview, and validate help content before applying updates.
