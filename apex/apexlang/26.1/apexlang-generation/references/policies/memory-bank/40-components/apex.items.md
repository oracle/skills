# Items (APEXlang Components)

## Purpose
- Define deterministic, template-driven guidance for adding items to pages while honoring governance:
- Snippets containing `{{...}}` are `metavariable_template` examples. Bind every variable from schema evidence before emitting SQL or APEXlang.
- When generating items, load the matching template under `templates/items/` or `template-components/` first.
  - Follow references/policies/memory-bank/00-guard/ai.guard.md and 10-global/apex.global.md.
  - Never invent attributes or UT classes; use only what exists in templates/items/*.
  - Prefer declarative behavior; push heavy logic to DB packages/views; guard DML by button/process.
  - SQL must be in triple backticks.

## Scope and Types
- Item categories:
  - Form items: placed on data-entry/detail regions (e.g., page/form). Participate in DML guarded by button/process.
  - Filter items: placed on list/report regions (e.g., interactive report) to filter/query; do not perform DML.
- Router/NLU uses assets/apex-generation/components.registry.json and assets/rules-mapping.json item keywords to select these rules.

## Templates Index (authoritative)
- Use only existing templates from templates/items/:
  - Text
    - text-field/_index.md
    - text-area/_index.md
    - text-autocomplete/_index.md
  - Choice/LOV
    - select-one/standard.md
    - select-many/standard.md              # canonical multi-select reference
    - select-list-static.md
    - select-list/_index.md                 # canonical select-list reference (static, dynamic-form, dynamic-filter)
    - combobox/_index.md
    - shuttle/_index.md
    - radio-group/_index.md
    - checkbox/_index.md
  - Date/Time
    - date-picker/_index.md
  - Numeric and Special
    - number-field/_index.md
    - switch/_index.md
    - star-rating/standard.md
    - color-picker/standard.md
  - Display and Upload
    - display-only/standard.md
    - file-upload/_index.md
    - hidden-item/_index.md
  - Rich Editing
    - rich-text-editor/_index.md
- Selection rules:
  - Use the most specific template that matches the requested control and context (form vs filter).
  - For select lists (static or dynamic), use select-list/_index.md and choose the matching variant markdown file in that family.
  - If a requested visual lacks a template, fall back to the nearest supported template and record a Limitation in Critique; do not invent.

## General Rules (non-negotiable)
- Always start from the template file under templates/items/* and adapt only allowed properties present in that template.
- Also validate against `assets/component-attributes.json` when a schema entry exists for the item type. Schema is authoritative over template prose/examples.
- Builder visibility is not a complete validity test. Some item properties may be hidden in specific Builder states yet still remain compiler-valid DSL properties; prefer compiler-backed metadata and `assets/component-attributes.json` over Builder UI visibility when those disagree.
- Do not introduce properties or attributes that do not exist in the chosen template.
- Visible item-template defaults, label treatment defaults, and other template-driven presentation choices are composition policy. Resolve those defaults from `references/policies/memory-bank/40-components/apex.templates.md` before applying item-family specifics here.
- Do not invent CSS classes. Resolve visible template, label, spacing, and framing choices through `references/policies/memory-bank/40-components/apex.templates.md`.
- Validate names and labeling via 10-global/apex.global.md conventions.
- Hidden item guardrail: for `type: hidden`, do not emit a `label { ... }` block.
- For form items that drive DML, ensure there is an explicit button/process guard (see 20-data/apex.logic.md) rather than side effects in item definitions.

## Layout Scope
- Generated application page items are linted against this local-scope contract; visible app artifacts do not bypass the equal-width rule.
- Page items use a local 12-column grid inside their parent region, grouped by `layout.region + layout.slot`.
- The total explicit `columnSpan` of sibling items in one row must not exceed 12 within that item scope.
- Do not add item spans to the parent region span; the item scope resets to 12 columns inside the parent region.
- For equal-width item rows, omit `column` / `columnSpan` and use `startNewRow: false` on second-and-later siblings.
- Treat `layout.labelColumnSpan` as an optional override, not a default-to-emit property. Use the canonical name `labelColumnSpan` when a deliberate label-grid override is needed; never use the legacy alias `labelColSpan`.
- Common repo usage emits `labelColumnSpan: 0` for hidden/control-shell or certain non-floating optional item layouts, but other visible templates can also use non-zero values when label-grid width needs an explicit override.

## Case Sensitivity and Item Types
- Item types are case-sensitive; use names exactly as provided by templates in templates/items/*.
- Known pitfalls:
  - textarea must be lowercase (not text area).
  - numberField and datePicker follow camelCase exactly as templates.
- When uncertain, cross-check existing generated artifacts and templates rather than guessing.

## LOV Patterns (deterministic)
- Shared LOV reference names in pages must exactly match those defined in shared-components/lovs.md (case and underscores are significant).
- In columnMapping, return and display must match actual database column case (typically uppercase).
- Table and SQL LOV definitions must expose parser-visible top-level display and return mappings; do not hide them only in prose or comments.
- SQL LOVs must project deterministic display and return aliases and the item/column mapping must reference those aliases exactly.
- Static LOV:
  - Use select-list-static.md.
  - Populate static entries exactly as the template demonstrates; do not invent attribute names.
  - Represent each entry with both display and return values; do not use scalar-only entries when the template supports structured entries.
  - When schema metadata clearly represents a finite enum, prefer a Static LOV over SQL that selects constants from `dual`.
- Dynamic LOV (Form context):
  - Use select-list/_index.md (dynamic form variant).
  - Provide SQL as a triple-backticked multi-line string; specify value/display mapping conceptually as per the template (e.g., value=id, display=name), using only properties that exist in the template.
  - If using shared LOVs, coordinate with shared-components/lovs.md or shared-components/lovs.md; do not duplicate definitions.
- Dynamic LOV (Filter context):
  - Use select-list/_index.md (dynamic filter variant) with the same SQL and mapping requirements.
- Autocomplete/Combobox:
  - Use text-autocomplete/_index.md or combobox/_index.md according to desired UX; supply SQL source in triple backticks if the template expects it.

Example (conceptual, align strictly with template properties)
```
-- Dynamic LOV SQL (triple backticks required)
```
```
select {{lookup.valueColumn}} as value, {{lookup.displayColumn}} as display
from {{lookup.table}}
order by {{lookup.displayColumn}}
```
```
- Reference the template for how to attach this SQL to the item; do not add new properties.
```

## Item Selection Guidance
- Text input → text-field/_index.md; multi-line → text-area/_index.md.
- Numbers → number-field/_index.md.
- Single choice from small set → radio-group/_index.md (form), or select-one/standard.md.
- Multiple choice → checkbox (boolean) / checkbox group (if template available) / select-many/standard.md / shuttle/_index.md depending on cardinality and UX.
- Dates → date-picker/_index.md.
- Boolean toggle → switch/_index.md.
- Read-only → display-only/standard.md.
- Files → file-upload/_index.md (ensure storage/process is handled declaratively or via DB/logic rules; do not embed heavy logic in item).
- Rich content → rich-text-editor/_index.md.
- Colors → color-picker/standard.md.
- Ratings → star-rating/standard.md.

## Filter vs Form Context
- Form items:
  - Participate in Create/Update; bind to record keys and columns.
  - DML must be guarded by explicit buttons/processes; validations should be declarative where possible.
- Filter items:
  - Do not perform DML; they alter query conditions.
  - Pair with page logic that refreshes target report/region declaratively (see dynamic-action templates if applicable).

## Data and Validations
- Use declarative validations when supported; otherwise push complex checks to DB packages or views (20-data/apex.logic.md).
- For default values and computations, prefer declarative mechanisms or DB expressions; avoid inline procedural logic in item definitions.

## Accessibility and Naming
- Labels should express the field name; help text carries the “why/how.”
- Every user-editable item and every filter/control item should carry concise help by default unless the item is purely technical or hidden.
- Treat `simple`, `quick`, `starter`, or similar prompt wording as a content-density signal only. It is not an exemption from default help text on visible user-facing items.
- Prefer authoritative help sources first. When those are missing, provisional concise copy is allowed if it remains neutral, translation-ready, and tied to a Text Message key or planned key.
- Inline help must stay within template allowances and reference Text Messages for localization.
- Detailed help dialogs (when template exposes `helpText`) should stay under ~400 characters and explain why the value matters, key validation expectations, or interpretation notes.
- Repeated help wording across items should be centralized in shared Text Messages rather than duplicated inline.
- Item names should follow global naming conventions; avoid ambiguous or overloaded identifiers.

## Governance and Safety
- Never invent attributes; adhere to the exact attribute structure in the selected template under templates/items/*.
- Use only existing templates listed in this document; if a requested type is not available, select the nearest supported one and record a limitation.
- SQL in triple backticks only; sanitize inputs by relying on APEX declarative features and DB-side logic rather than ad-hoc code.

## Artifacts and Orchestration
- Draft → Critique → Revision pipeline:
  - Agent 2 validates that selected item templates exist and flags any missing inputs (e.g., LOV mapping) and emits PASS/CONFIDENCE headers.
  - Agent 3 applies only accepted notes and writes finals to generated application pages/ (or app_###/pages/ for whole app runs).
- Critical pages and shared components are enforced by the master workflow; items must not bypass those gates.
