## Classic Report Page Standards

### Purpose
- Produce classic report pages with deterministic layout, region templates, and column alignment.

### Rules (Non-Negotiable)
1. Use `pageTemplate: @/standard` (or other documented layout) with `templateOptions: #DEFAULT#`.
2. Main report region must use `type: classicReport` and follow the canonical Classic Report `appearance` and `componentAppearance` blocks owned by `references/policies/memory-bank/40-components/apex.templates.md`.
   - Classic Report `componentAppearance.templateOptions` defaults to `#DEFAULT#`, `t-Report--stretch`, and `t-Report--horizontalBorders`.
   - Alternating rows are disabled by omission; do not emit `t-Report--altRowsDefault` or `t-Report--staticRowColors`.
   - Do not emit row-highlighting by default.
   - Contextual Info Classic Reports are the documented appearance override: use `appearance.template: @/contextual-info` and `appearance.templateOptions` exactly `#DEFAULT#`, `t-Region--hideHeader js-addHiddenHeadingRoleDesc`, and `t-Region--noUI`.
3. Default pagination is `rowRangesXToYNoPagination` with a `whenNoDataFound` message; switch to another catalog type only when user intent demands it or performance requirements warrant.
4. Apply navigation/breadcrumb requirements from `apex.page.md`.
5. When report navigation is added or changed, ask every time which link mode is required: same application page, another application page, or URL redirect.
6. For same-application navigation, prefer declarative page targets on the region or column link definition when the DSL supports it; do not default to SQL-computed `apex_page.get_url(...)` or `type: url`.
7. Every delivered SQL or table projection must have an explicit `column (...)` definition before finals. Do not rely on implicit generated columns for delivered Classic Reports.
8. Hidden Classic Report columns must omit the `heading` block entirely. This differs from Interactive Report, where hidden columns still require `heading { heading: ... }`.
9. Classic Report columns with a column-level `link {}` block must also emit top-level `type: link`.

### DB-First Source Verification (Required)
- For `source.location: localDatabase`, verify source object metadata before writing SQL:
  - object exists (table/view)
  - selected columns exist
  - `ORDER BY` column(s) exist
- Use `db_connection_name` metadata evidence before drafting final SQL; do not assume names.
- If metadata is missing/unverified, stop with Missing Inputs and do not emit final SQL.
- The same DB-first expectation applies to interactive report work when it uses `localDatabase`.

### Guidance
- Mirror `templates/page-examples/classic-report-page/classic-report-page._index.md` for structure, column ordering, and the canonical Classic Report `appearance` and `componentAppearance` blocks.
- Keep classic report `appearance.templateOptions` to exact accepted values. `#DEFAULT#` stays standalone, documented composite values remain one atomic entry when the catalog/runtime lists them that way, and inline comma arrays remain invalid.
- Emit the canonical Classic Report `componentAppearance` block with `template: @/standard` and a multi-line `templateOptions` array containing `#DEFAULT#`, `t-Report--stretch`, and `t-Report--horizontalBorders`. `appearance` controls the outer region wrapper; `componentAppearance` controls the report component template required by runtime validation. In the 26.1 compiler metadata this is property `411`, and live validation reports omissions as `Missing required parameter (411): componentAppearance - template (string)`.
- For interactive behaviours, add dynamic actions via the appropriate component templates rather than inline code.
- For HTML-rendered status badges/highlights, use `columnFormatting.htmlExpression` with implicit plain-text columns.
- Do not emit `type: richText` for `columnFormatting.htmlExpression` patterns.
- Follow `references/policies/memory-bank/30-pages/apex.report-column-rendering.md` for all SQL-vs-column rendering behavior, formatting-block placement, and HTML literal rules.
- For same-app drill navigation, define the target declaratively on the report column whenever the component contract supports it. Keep SQL URL columns only for explicit URL mode or components that genuinely require a URL string.
- For Classic Report column links, keep the report projection column explicit and emit `type: link` next to `reportColumnQueryId` and `derivedColumn`; do not rely on the `link {}` block alone to imply link rendering.
- Make the primary-key decision explicit:
  - when row navigation or row identity is part of the page behavior, keep the PK as an explicit report column and wire the target declaratively
  - when navigation is not intended, keep the PK hidden as a technical column
- Keep the stronger "all delivered projections need explicit columns" rule limited to Classic Report, Interactive Report, and report-type template components whose family guidance requires projection-aligned child columns by default, such as Metric Card and Content Row.
- Classic reports should include a default guidance layer. Provide concise user-facing guidance for business-significant columns and all derived, status, and action columns using the supported guidance hook in the selected template family; when no dedicated column-level runtime hook exists, surface that user-facing guidance in page or region help.
- Apply that default guidance layer even to simple or lightweight classic reports. Keep it concise, but do not omit it merely because the page has one report region or a small column set.
- Include `comments { comments: ... }` by default on key report columns and high-value report regions. Treat it as descriptive metadata, not help text. For report columns, require the attributes `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, and `Authorization Scheme`; include `Summary` only when a short leading business-intent sentence materially helps maintenance. When `Summary` is present, keep the field order `Summary`, `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, `Authorization Scheme`. Mirror executable settings such as `appearance.formatMask` and `security.authorizationScheme` when those blocks are emitted.
- Hidden technical IDs may skip user-facing guidance, but important technical, derived, status, and action columns still require developer comments.
- Hidden Classic Report columns should remain structurally lean: omit `heading`, keep explicit sequence/order metadata, and keep comments only when the technical column remains important for maintenance.
- Critique should fail when a business-significant visible column lacks its expected guidance layer or maintainability comment without an explicit exemption.
- Column-level `security { authorizationScheme: ... }` is optional but must reference an existing scheme from `{your-app-alias}/shared-components/authorizations.apx` when present; do not invent scheme names. `@authorization-scheme-placeholder` represents the authorization scheme name of choice from user should it be prompted.
- Column types must align with the canonical catalog in `region-components/classic-report/classic-report._common.md` (plainText, plainTextBasedOnLov, richText, link, image, downloadBlob, hidden). When using `plainTextBasedOnLov`, include `lov { type: sharedComponent|static listOfValues: ... }` with a valid Shared Component (e.g., `@BOOLEAN`).

### Filtering with Page Items
- Use `templates/region-components/classic-report/classic-report._common.md` for the region contract and pair filter controls with the matching item template (for text search, `templates/items/text-field/text-field._index.md`).
- When demonstrating filtering patterns, keep the SQL source deterministic and include bind predicates with leading commas and deterministic ordering. Example predicate:
  ```sql
  where (:P3_SEARCH is null
     or upper(p.name) like '%' || upper(:P3_SEARCH) || '%')
  order by p.name
  ```
- Set `pageItemsToSubmit` on the report region to the filtering items (`P3_SEARCH`) so the bind value is sent with each refresh.
- Create a filter item with `settings { subtype: search }`, place it in a dedicated container region, and follow naming conventions (`P[page]_[name]`). Reference `40-components/apex.items.md` for additional item attributes.
- Add a dynamic action that listens to the filter item (e.g., `event: keypress`) and runs a `native-refresh` action on the target report region. Maintain pagination preferences and rely on declarative refresh instead of ad-hoc JavaScript.
- Document any authorization on filtered columns, mirroring the report column rules. Keep process logic separate; filtering does not require `invokeApi` processes, but downstream submit logic must still honor `20-data/apex.logic.md`.
- When promoting this pattern, mention alternatives (Interactive Report search, Faceted Search) and note that classic report filtering remains useful for lightweight, single-field searches.
