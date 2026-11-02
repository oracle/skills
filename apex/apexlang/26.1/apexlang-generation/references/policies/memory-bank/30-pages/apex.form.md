# APEX Form Standards

Rules and conventions for creating and maintaining Oracle APEX **Form Pages** and form regions.
Form targets may be modal dialogs, drawers, or normal embedded/detail pages based on the routed workflow, and must be based on the shared page-form templates under `/templates/page-examples/` and region form templates under `/templates/region-components/form/`.

---

## General
- Always start from page form examples in `templates/page-examples/` (for example, `form-page.md`) and pair with `templates/region-components/form/form.basic.md`.
- Default single-row create/edit form pages launched from reports to drawer end/right; use standard modal dialog, alternate drawer positions, or normal embedded/detail pages only when the routed workflow or page design requires that page mode.
- Refer to `apex.page.md` for page creation steps
- Maintain naming consistency and follow the form generation flow defined in global standards

---

## Page Items
- Non-negotiable: When instantiating regions/items/buttons, load the corresponding templates in `templates/region-components/` or `template-components/` before drafting.
- **Naming Convention:** `P[page_number]_[column_name]`
  Example: `P3_TITLE`, `P5_NAME`
- **Supported Item Types:**
  `textarea`, `textField`, `selectList`, `radioGroup`, `checkboxGroup`, `datePicker`, `numberField`, `displayOnly`
- **Required Fields:**
  - Use `@/required-floating` template
  - Add `valueRequired: true` to the `validation {}` section
- **Optional Fields:**
  - Use `@/optional-floating` template by default
  - Only use non-floating alternatives when the page is intentionally demonstrating another label layout or a component-specific exception is documented
- **Visible Item Template Defaults:**
  - Resolve default item-template and label-treatment choices from `references/policies/memory-bank/40-components/apex.templates.md`.
  - Keep form-specific exceptions in this file only when the form workflow needs a stricter rule than the shared composition default.
- **List of Values (LOVs):**
  - **Static LOVs** → `lovType: static`
    Prefix values with:
    - `STATIC:` for sorted
    - `STATIC2:` for unsorted
  - **Dynamic LOVs** → `lovType: sqlQuery`
  - Always confirm column names with the **data dictionary**

---

## Data Types
- Always set the dataType attribute to lowercase

## Layout
- To align items horizontally → `startNewRow: false`
- Key layout attributes:

  | Attribute | Description |
  |------------|-------------|
  | `sequence` | Controls display order |
  | `startNewRow` | Determines new row (true/false) |
  | `column` | Column position (1–12) |
  | `columnSpan` | Columns spanned (1–12) |

- The total of `columnSpan` per row should never exceed 12
- A form region creates its own local 12-column grid for page items inside `layout.region`
- Child item spans are validated against sibling items in that form region, not against the parent page or parent region span
- Strive to get the total `columnSpan` to 12 as much as possible; leaving space is not optimal
- If the items are the same width, then omit `columnSpan`
- Omit `column` and `columnSpan` unless necessary
- Use `startNewRow: false` for items on the same grid line

### Buttons Region Placement
- Default: Place the Buttons region in `BODY` using the `@/buttons-container` template (as in `templates/page-examples/form-page/form-page._index.md`).
- Allowed variant: Place the Buttons region in the page `BODY` slot when the page layout requires buttons inline with content (e.g., single-column forms or specific aesthetic/composition needs).
- Constraints for BODY placement:
  - Keep the region template as `@/buttons-container` and preserve the standard buttons (Cancel, Create/Save, Delete) with their sequences and behaviors.
  - Do not add custom CSS classes. Keep spacing, alignment, and density inside the shared template/template-option defaults from `references/policies/memory-bank/40-components/apex.templates.md`.
  - Maintain keyboard accessibility and focus order; ensure buttons remain visible and logically grouped with the form.
  - Ensure responsive behavior (stacking on small screens) is not impeded.

---

## Foreign Keys
- For **foreign key columns**, use a **selectList** item
- The LOV source must be **dynamic SQL**
- Follow `templates/page-examples/form-page/form-page._index.md` for standard examples.

---

## Help Text
- Form pages should include page-level help on major user-facing workflows plus concise help text on every user-editable item and filter/control item by default.
- This default remains in force for simple forms, starter forms, quick CRUD dialogs, and small admin pages. Reduce verbosity when needed, but do not omit help text solely because the form is simple.
- Use authoritative sources for help content first: prefer reviewed table column comments, approved documentation, or existing Text Messages.
- When authoritative sources are missing, provisional concise copy is allowed if it stays neutral, translation-ready, and tied to a Text Message key or planned key.
- Inline help (`inlineHelpText`) must be concise (≤60 characters) and clarify format or intent without repeating the label.
- Detailed item help (`helpText`) should cover why the value matters, validation highlights, and example values; cap at ~400 characters and reference the Text Message key in drafts.
- Primary create/save buttons should include concise guidance when the selected button pattern exposes a supported help or annotation hook without cluttering the page.
- Repeated help text across forms should be centralized in Text Messages so batch wording changes stay easy.
- Batch updates must rely on the Help Text workflow to ensure consistent sourcing and logging.
- Critique should fail when visible editable items or visible filter/control items are missing default help text without an explicit exemption.

---

## Implementation Defaults
- Template paths:
  - `templates/page-examples/form-page/form-page._index.md`
  - `templates/region-components/form/form.basic.md`
- Modal: `true`
- Use Required Floating: `true`
- LOV Verification: Always confirm SQL and column sources
- Examples:
  - `templates/page-examples/form-page/form-page._index.md`
  - `templates/region-components/form/form.basic.md`

---

## Deterministic CRUD Form Routing
- Detection (from parent regions):
  - If a Classic Report, Interactive Report, or any SQL-generated link (e.g., apex_page.get_url) passes a primary key/ROWID to a target page, the target is a Form page for that base table/view.
  - If the parent region is an Interactive Grid already configured as editable (edit.enabled), prefer inline IG CRUD with interactiveGridAutoRowProcessing instead of generating a separate form.

- Modal vs Standard target:
  - Default to a drawer end/right form for single-row edit/create flows initiated from a report row link or an “Add/Create …” button.
  - Use a non-modal “detail” page with an embedded form region only when the design requires composite layouts with additional IG subregions (e.g., drill-down detail pages). Such pages still use the same ARP (Auto Row DML) for the form region.
  - Use standard modal dialog only when the requirements or completed application spec explicitly request centered dialog behavior; drawer forms must explicitly set the end/right drawer option, and require explicit evidence for start/left, top, or bottom positions.
  - Treat "popout" as a standard modal-dialog presentation unless the requirements define a specific drawer or wizard behavior.

- Required form scaffolding (normal, modal, or drawer):
  - Start from `templates/page-examples/form-page/form-page._index.md`; use `appearance.pageMode: modalDialog` for modal dialogs and the drawer template/page-mode contract when the target is a drawer.
  - Form region source: tableName + includeRowidCol: true (or explicit PK mapping).
  - Every generated form region must include an authoritative PK-backed page item mapped to that form region.
  - For a single-column primary key, generate one hidden PK item with `source.formRegion`, `source.column`, `source.dataType`, and `primaryKey: true`.
  - For composite primary keys, generate one hidden item for each PK column and set `primaryKey: true` on each PK source mapping.
  - Do not emit `primaryKey: false` placeholders on non-PK form items; omit the property unless the item is a true primary-key mapping.
  - Keep the form region edit block minimal: `edit { enabled: true }`.
  - Do not emit `edit.add`, `edit.update`, or `edit.delete` on form regions; those operation flags belong to interactive grid edit contracts, not regular forms.
- Buttons:
    - CANCEL (definedByDynamicAction)
    - CREATE (`serverSideCondition.type: itemIsNull` on the PK item; databaseAction: insert)
    - APPLY-CHANGES (`serverSideCondition.type: itemIsNotNull` on the PK item; databaseAction: update)
    - DELETE (`serverSideCondition.type: itemIsNotNull` on the PK item; uses apex.confirm(...); databaseAction: delete)
  - Processes:
    - formInitialization (afterHeader)
    - exactly one `formAutoRowProcessing` (Auto Row DML) for the form region
    - when action-specific success text is required, use a transient hidden item such as `P<page>_SUCCESS_MESSAGE` plus a lightweight pre-DML process that sets the item from `:REQUEST`, then reference that item in the single ARP `successMessage`
    - Close Dialog (showSuccessMessages: false)

- Create vs Edit inference:
  - “Add/Create …” buttons do not pass a PK → show CREATE, hide APPLY-CHANGES/DELETE.
  - Row edit links pass PK/ROWID → show APPLY-CHANGES/DELETE, hide CREATE.
  - Foreign keys needed by the target form should be populated via defaults from parent items (e.g., project_id), matching examples.

- Dialog refresh contract (parent page):
  - Always register a Dynamic Action on `apexafterclosedialog` to refresh the originating region(s) and optionally show a page success message.
  - Do not emit aliases such as `dialogClosed`; the event token must match the approved dynamic-action event contract exactly.
  - Use the standard template: templates/business-logic/dynamic-actions/dynamic-actions.refresh-region-after-dialog.md.
  - Bind to the specific region(s) affected (e.g., classic report, IR, or IG) as shown in examples.
  - If you need additional runtime checks, use a `serverSideCondition` from the catalog (references/policies/memory-bank/20-data/apex.logic.md) and follow the syntax examples documented there when combining DA and component conditions.

- Security and protection:
  - Set pageAccessProtection: argumentsMustHaveChecksum on both parent and form pages.
  - PK/critical items: sessionStateProtection: checksumRequiredSessionLevel.
  - Keep warnOnUnsavedChanges disabled for dialog navigations to mirror examples.

- Special case — IG inline CRUD:
  - For editable Interactive Grids (edit.enabled with allowedOperations), do not generate a separate form:
    - Provide interactiveGridAutoRowProcessing.
    - Ensure PK/ROWID columns are hidden and correctly marked as primaryKey.
    - Set foreign keys via defaults (e.g., item defaults) when appropriate.

## Notes
- Consistency > creativity — all APEX forms should look and behave the same
- Validate required fields and dynamic LOVs before deployment
- Align layout grid to APEX 12-column structure
- Keep form SQL minimal and offload logic to views or packages when possible
