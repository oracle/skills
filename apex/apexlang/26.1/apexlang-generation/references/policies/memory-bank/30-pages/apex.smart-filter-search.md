## Smart Filter Search Page Standards

Canonical rules for a non-modal Oracle APEX page built around one Smart Filters region and one authoritative results region.

Keywords: smart filter, smart filters, smart filter search, searchable attributes, suggestion chips, refinements

---

## Purpose and Authority

- Use the `smart-filter-search` pattern and construction pack before loading this page standard or its template family.
- Use compiler metadata for APEXlang legality. Ticket fields are requirements, not proof that a same-named DSL property exists.
- Use the exact Smart Filter family contract at `templates/region-components/smart-filter-search/smart-filter-search._common.md` after the structured pack is selected.

### Deterministic routing precedence

- `Smart Filter Search` or `Smart Filters region` -> `smart-filter-search`; exclude `faceted-search`.
- `Faceted Search`, `facets`, or generic filtering -> `faceted-search`.
- `Cards` + generic filtering or `cards search` -> `faceted-search`; Cards are results only.
- `Cards` + direct Smart Filter Search wording -> `smart-filter-search`; no co-ownership.

These precedence rules are routing behavior and are covered by resolver tests; they do not authorize mixing Faceted Search and Smart Filters on one page.

---

## Required Generation Plan

Do not generate until the plan records all of the following:

| Decision | Required evidence |
|----------|-------------------|
| `base_region_static_id` | One exact, page-unique results-region static id. |
| `base_source` | Secured view or canonical SQL plus `object_evidence_source: schema_doc | live_db | user_asserted`. |
| `searchable_attributes` | Explicit non-empty allowlist proven in the base projection. |
| `match_semantics` | One of `contains`, `starts`, or `exact`, plus supported per-attribute overrides if any. |
| `min_chars` / `max_len` | Positive integers with `max_len >= min_chars`. |
| `tokenization_policy` | Frozen trimming, whitespace, punctuation, case/accent, and token-order behavior. |
| `settings_contract` | Requested values and property-level compiler evidence for the target build. |
| `security_scope` | Effective authorization and server-side condition for the Smart Filters region, base region, suggestions, and refinements. |
| `performance_readiness` | Index/search strategy, statistics status, and expected cardinality. |

Stop with Missing Inputs while any required decision or evidence source is unresolved.

Persist the structured plan as JSON beside the app (for auto-discovery) or pass it through the generation gate. Keep ordinary `apexlang validate --app-path <path>` flag-free; use `--require-smart-filter-generation-plan` only at a mandatory generation gate. A plan may contain one direct page object or a `pages` array keyed by page number.

Validation layers:

- `artifact`: topology, target type/order, source mode/projection, wildcard rejection, allowlist order, scope inheritance, refinement shape, compiler-supported settings.
- `plan`: object evidence, `no_rewrite`, match/length/tokenization/compiler evidence, index strategy, statistics, cardinality.
- `runtime`: focus/announcement behavior, no-reload refresh, filtered exports under active scope.

Templates and ticket prose are not evidence for `plan` or `runtime`.

---

## Page Composition

1. Use the Standard page template unless a higher-precedence page contract proves another layout.
2. Place page-level navigation and create actions in the breadcrumb/title-bar region when present.
3. Declare exactly one Smart Filters region before exactly one authoritative base results region.
4. Bind `source.filteredRegion` to `@<base_region_static_id>` and to no other region.
5. Keep optional maps/charts as sibling visualizations; they are not additional Smart Filter base regions.
6. Keep keyboard order from page guidance to Smart Filters to results.

The APEX 24.2 base-region allowlist is Classic Report, Cards, Map, and Calendar. Interactive Report, Interactive Grid, and Content Row are not supported by this pinned contract. See [Oracle APEX 24.2 Smart Filters](https://docs.oracle.com/en/database/oracle/apex/24.2/htmdb/creating-smart-filters-page-manually.html). Target the Map region static id, not a layer; this single-dataset contract requires exactly one Map layer with a provable source. Additional visualizations may remain siblings. Preserved Markdown syntax examples from other compiler releases are not APEX 24.2 compatibility evidence; the pinned allowlist is enforced on generated `.apx` artifacts.

---

## Base Region and Source Contract

- The page has exactly one base region for search, suggestions, refinements, and result count semantics.
- `base_region_static_id` is mandatory and must resolve to that region's exact static id.
- The base source is a secured view or supplied canonical SQL. Prove all objects and projected columns before generation.
- Record named `base_source.object_evidence` entries with `object` and `source` (`schema_doc`, `live_db`, or `user_asserted`) matching every emitted source object. Booleans, bare evidence labels, and unrelated object names do not qualify.
- For `secured_view`, the entry matching `tableName` must additionally declare `object_type: view` and `secured: true`; a `tableView` source or a column dictionary alone does not prove a secured view.
- For `canonical_sql`, store the supplied SQL in `base_source.canonical_sql`. Validation compares it to the emitted SQL unchanged, apart from outer whitespace. The local object-scope checker supports simple SELECTs, joins, subqueries, and named function calls; CTEs, database links, and opaque table functions stop with Missing Inputs until their object scope can be proven.
- Do not auto-modify, widen, wrap, or inject predicates into canonical SQL to satisfy Smart Filter requirements.
- Do not use `select *`; keep the projection explicit so searchable and display columns can be proven.
- Preserve bind variables and the security predicates owned by the supplied source.
- Results-region pagination, download, no-data messaging, and column presentation remain owned by the selected exact results-region contract.
- `SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001` blocks generation unless the source mode, object evidence, explicit projection, and no-rewrite decision are recorded.

---

## Searchable Attributes and Filter Children

- Emit at least one `type: search` child using `source.dbColumns`.
- Populate `source.dbColumns` only from the ordered `searchable_attributes` allowlist. Never infer the allowlist from every projected column.
- Every allowlisted attribute must exist in the security-trimmed base projection. Hidden, sensitive, tenant-key, and authorization-control columns are not searchable unless explicitly approved.
- Order the primary search child before categorical and range refinements.
- Use page-scoped filter tokens such as `P{page}_F_SEARCH`; avoid generic or colliding names.
- Categorical/range LOVs and values must be subsets of the same base dataset and must follow the compiler-valid child shape.

---

## Search Semantics and Tokenization

- Record one default semantic: `contains`, `starts`, or `exact`. Do not leave matching behavior implicit.
- `contains` matches a normalized token within a value; `starts` matches when the normalized value starts with the token; `exact` matches the complete normalized value.
- Do not execute searches or suggestions below `min_chars`.
- Reject input above `max_len` predictably; do not silently mutate it in SQL.
- Apply the same frozen tokenization policy to search, suggestions, and refinements. Define trimming, repeated whitespace, punctuation boundaries, case normalization, accent normalization, duplicate tokens, and token order.
- Use bind values for user input. Never concatenate search text into SQL.
- `SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001` blocks generation unless exactly one semantic, positive integer bounds with `max_len >= min_chars`, every tokenization decision, and property-level compiler evidence are recorded.
- If the active compiler cannot represent a required behavior, stop with Missing Inputs instead of inventing a property or rewriting the base source.

---

## Compiler-Gated UI Settings

The required UI contract is:

- `maxSuggestionChips: 100`
- `moreFiltersSuggestionChip: true`
- `compactNosThreshold: 10000`
- `showTotalRowCount`: explicitly `true` or `false`
- `totalRowCountLabel: Results` when `showTotalRowCount` is `true`; omit it when false

For each property, record the target compiler build and active-property evidence. Emit only properties exposed by that compiler. `SMART_FILTER_SETTINGS_VALUE_REQUIRED_001` enforces the values above for every supported property, including the conditional count label. Missing evidence raises `SMART_FILTER_SETTINGS_COMPILER_EVIDENCE_REQUIRED_001`; unsupported properties raise `SMART_FILTER_SETTINGS_UNSUPPORTED_001` and remain unresolved until the target build or an approved alternative satisfies the requirement. Never silently discard requested values.

---

## Security and Data-Leakage Contract

- The Smart Filters and base regions must share the same effective authorization scheme and server-side condition.
- Apply the same checks recursively to `filterGroup` containers and their `checkbox` children. Groups inherit scope from their parent, and children inherit from the group. Validate group suggestion sources even when the group has no source column; validate every child column against the base projection.
- Both may omit authorization/condition only when the page contract explicitly permits the same public scope for both.
- Suggestion chips, suggestions, refinement values, counts, and result rows must derive from the same security-trimmed base dataset.
- Do not query a broader table for convenience, bypass a secured view, or omit tenant/row-level predicates in suggestion/refinement sources.
- Treat a suggestion value or count visible outside the base security scope as a data leak and a merge blocker.

---

## Performance Readiness

- Record expected base cardinality and the data-volume assumption used for UX and query decisions.
- Confirm optimizer statistics status for the base objects and relevant indexes.
- Record an index/search strategy for every searchable attribute and selected semantic.
- Do not claim that a normal B-tree index optimizes substring `contains` behavior. Prove a compatible text/function-based strategy or record the accepted scan cost.
- `SMART_FILTER_PERFORMANCE_READINESS_REQUIRED_001` blocks readiness while index strategy, statistics status, or expected-cardinality evidence is missing.
- Avoid applying functions to indexed searchable columns unless matching function-based index evidence exists.
- Do not mark the implementation ready while index strategy, statistics status, or expected cardinality is unresolved.
- The validator rejects duplicate `source.dbColumns` entries and, when a Generation Plan is supplied, requires the emitted order to equal the declared ordered allowlist.

---

## Accessibility and UX

- Give every search/refinement child a concise visible label and useful help when behavior is not self-evident.
- Use the search landmark when compiler truth supports the selected Smart Filters accessibility shape.
- Keep total-count labeling consistent: `Results` only when total row count is shown.
- Preserve visible focus order and announce result changes through supported native region behavior.
- Add help/comments to every search and refinement child. Record compiler-supported landmark/focus behavior in the plan; do not invent accessibility properties.

---

## Validation Checklist

- Exactly one Smart Filters region targets exactly one existing base region and appears before it.
- `base_region_static_id` matches the target static id.
- Base source and every searchable attribute have accepted object evidence.
- `source.dbColumns` equals the explicit allowlist and contains no extra column.
- Match semantics, `min_chars`, `max_len`, and tokenization are explicit and consistent.
- Every requested setting has property-level compiler evidence and the required value.
- Authorization, server-side conditions, suggestions, refinements, counts, and results share one effective security scope.
- Index strategy, statistics status, and expected cardinality are recorded.
- Search refreshes results without page reload and exports honor the active filters.
- Runtime acceptance records both result refresh without page reload and filtered export behavior.

---

## References

- Structured contracts: `assets/contracts/page-patterns.json`, `assets/contracts/page-construction-packs.json`
- Template family: `templates/region-components/smart-filter-search/`
- Cross-region constraints: `references/policies/memory-bank/40-components/apex.region-interactions.md`
- SQL and evidence rules: `references/policies/memory-bank/20-data/apex.sql.md`, `references/policies/memory-bank/00-guard/ai.guard.md`
- Alternative filtering pattern: `references/policies/memory-bank/30-pages/apex.faceted-search.md`
