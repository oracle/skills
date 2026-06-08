## Faceted Search Page Standards

### Purpose
- Ensure faceted search pages generate deterministically with Universal Theme defaults.
- Clarify when to use Faceted Search versus Smart Filters. See `apex.smart-filter-search.md` for the Smart Filter pattern.

### Rules (Non-Negotiable)
1. **Page Template**
   - Use `pageTemplate: @/left-side-column` with `templateOptions: #DEFAULT#`.
   - Include a Breadcrumb region in `slot: breadcrumbBar` using the title-bar template and the standard breadcrumb component appearance.
2. **Faceted Region Placement**
   - Place the faceted search region in `slot: leftColumn` with `sequence: 10`.
   - Region `appearance.template` must be `@/standard`.
   - Keep `appearance.templateOptions: #DEFAULT#` unless a page-specific exception is explicitly documented.
3. **Results Region**
   - Use a Classic Report region located in `slot: body` with `sequence: 20`.
   - Set `appearance.template: @/standard` and `componentAppearance.template: @/standard`.
   - Preserve the column ordering from `page-examples/faceted-search/faceted-search._index.md` and align numeric columns to the end.
4. **Facet Definitions**
   - Emit child facet metadata with `facet (...)` blocks for this page family; do not guess between `facet` and `filter`.
   - Use the canonical emitted facet type names from the checked-in example and shared template family: `search`, `checkboxGroup`, `radioGroup`, `selectList`, and `range`.
   - Include `lov { type: distinctValues }` for all discrete-value facets (checkbox, select list, etc.).
   - Use page-scoped/static facet names to avoid item-name collisions during import (for example `P2_FACET_SEARCH`, `P2_FACET_CITY`, or `FS_SEARCH_TEXT`).
   - Do not use generic facet names such as `FACET_SEARCH` that may conflict with existing application-level items.
   - Type-scoped `listEntries` rule:
     - Emit `listEntries { maxDisplayedEntries: <n> }` only for `checkboxGroup` and `radioGroup`.
     - Use `maxDisplayedEntries: 10` by default, with a permitted range of 5-15 when requirements justify a denser or shorter list.
     - For likely high-cardinality facets such as Product, Customer, Store, Assignee, Owner, User, Employee, Supplier, Email, SKU, or name/title facets, set `displayFilterInitially: true` in `listEntries` so users can search facet values immediately.
     - Do not emit `listEntries` for any other facet type (for example `range`, `selectList`, `search`).
   - Use consistent facet sequencing: search → categorical facets → range facets.
   - Facet `source.dataType` is runtime-sensitive:
     - For date/time range facets, emit `source.dataType: date` even when the schema column is `TIMESTAMP`.
     - For numeric range or numeric ID facets, emit `source.dataType: number`.
     - For text/discrete string facets, omit `source.dataType`; do not emit `varchar2`, `VARCHAR2`, `STRING`, or other SQL/report data-type labels in faceted-search facet sources.
5. **Linkage**
   - `filteredRegion` must reference the results region static ID.
   - Do not emit `settings.currentFacetsSelector`; the live importer rejects that property in this runtime.
   - Do not emit internal runtime tokens such as `NATIVE_SEARCH` or `NATIVE_SELECT_LIST` unless a compiler-validated example explicitly requires them.
6. **Metadata Validation Gate**
   - For `localDatabase` sources, all result columns and `facet.source.databaseColumn` values must be metadata-validated via `db_connection_name` in SQLcl; otherwise STOP.
7. **Canonical Composition**
   - Keep the faceted-search region in the left-column slot instead of simulating a sidebar with BODY grid coordinates.
   - Mirror the canonical page example when choosing declaration order and slot usage for breadcrumb, results, and faceted-search regions.

### Guidance
- Mirror the example DSL in `templates/page-examples/faceted-search/faceted-search._index.md`.
- Apply navigation/breadcrumb standards from `apex.page.md` when creating new pages.
- Default facet presentation is inline. Only switch to `appearance { display: addFilterDialog }` when a documented page-specific exception requires it.
- Use the navigation list entry and breadcrumb patterns documented in the blank page rule (`apex.blank.md`) when scaffolding new faceted pages.
- Faceted Search result columns mirror classic report rules: provide concise user-facing guidance for business-significant, derived, status, and action columns using the supported guidance hook in the selected template family or page/region help when no dedicated runtime hook exists.
- Emit `comments { comments: ... }` by default as descriptive metadata. Require the attributes `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, and `Authorization Scheme`; include `Summary` only when a short leading business-intent sentence materially helps maintenance. When `Summary` is present, keep the field order `Summary`, `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, `Authorization Scheme`. Mirror executable settings such as `appearance.formatMask` and `security.authorizationScheme` when those blocks are emitted. Only add `security { authorizationScheme: ... }` blocks when needed, and always reference registered schemes from `{your-app-alias}/shared-components/authorizations.apx`.

### Anti-Patterns
- Do not place the faceted-search region in `slot: body` with `columnSpan` values to simulate a sidebar.
- Do not pair the standard faceted-search page pattern with an optional page-header wrapper region such as `FS_PAGE_HEADER`.
- Do not hide the faceted-search region header by default with `t-Region--removeHeader js-removeLandmark`.
- Do not use `parentRegion` breadcrumb wrappers for the standard faceted-search pattern; place the breadcrumb directly in `breadcrumbBar`.
