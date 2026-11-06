---
templateId: region.smart-filters.common
componentType: region
version: 1.3
description: Shared contract for a Smart Filters region, its search child, and one secured base results region.
---

# Purpose

Define the generation boundary for a Smart Filter Search experience without treating ticket fields as unproven APEXlang properties.

# Required Input Contract

Freeze these decisions in the Generation Plan before emitting a Smart Filters region:

| Name | Type | Contract |
|------|------|----------|
| `smartFiltersRegionStaticId` | string | Unique static id for the Smart Filters region. |
| `baseRegionStaticId` | string | Static id of the one authoritative filtered results region. |
| `baseSource` | object | Secured view or canonical SQL plus `object_evidence_source`; never inferred from examples. |
| `searchableAttributes` | non-empty ordered list | Explicit allowlist of base-source columns rendered to `source.dbColumns`. |
| `matchSemantics` | enum | One of `contains`, `starts`, or `exact`. |
| `minChars` | positive integer | Minimum input length that can run search or suggestions. |
| `maxLen` | positive integer | Maximum accepted input length; must be greater than or equal to `minChars`. |
| `tokenizationPolicy` | object | Stable whitespace, punctuation, case, accent, and token-order behavior. |
| `securityScope` | object | Effective authorization scheme and server-side condition for both regions and all suggestion/refinement sources. |
| `performanceReadiness` | object | Index strategy, statistics status, and expected cardinality evidence. |
| `settingsContract` | object | Ticket settings plus property-level compiler evidence for the target build. |

Validation boundary: artifact lint checks emitted topology, source/projection, allowlist order, scope, refinement shape, and supported settings; the plan gate checks object evidence, `no_rewrite`, search/compiler evidence, performance, and runtime acceptance. Use `apexlang validate --generation-plan <path>`; require it with `--require-smart-filter-generation-plan`.

# Generation Rules (MANDATORY)

1. Emit exactly one `smartFilters` region and bind it through `source.filteredRegion` to exactly one base results region.
2. Use `baseRegionStaticId` as the single binding value and declare the Smart Filters region before that target region.
3. Preserve the supplied secured-view or canonical-SQL base source. Do not rewrite, widen, or inject predicates into its SQL automatically.
4. Emit at least one `type: search` child whose `source.dbColumns` is the ordered `searchableAttributes` allowlist. Every entry must be projected by base source.
5. Keep filter children separate from the region shell and use page-scoped item names such as `P14_F_SEARCH`.
6. For APEX 24.2, target Classic Report, Cards, Map, or Calendar. Target a Map region rather than its layer, and prove exactly one layer source for the single-dataset contract. Never target Smart Filters, Faceted Search, or another non-results component.

# Output Template – Region Shell

```apexlang
region {{smartFiltersRegionStaticId}} (
    name: {{name}}
    type: smartFilters
    source {
        filteredRegion: @{{baseRegionStaticId}}
    }
    {{filters}}
)
```

# Output Template – Search Filter Child

```apexlang
filter {{searchFilterItemName}} (
    type: search
    label {
        label: {{searchFilterLabel}}
    }
    layout {
        sequence: {{searchFilterSequence}}
    }
    source {
        dbColumns: {{searchableAttributes}}
    }
)
```

# Search Behavior Contract

- Record exactly one default match semantic: `contains`, `starts`, or `exact`; record per-attribute overrides only when the selected compiler-supported shape can represent them.
- Do not execute search or suggestions below `minChars`. Reject input above `maxLen` predictably rather than silently changing the server-side value.
- Apply one frozen tokenization policy to search, suggestions, and refinements. It must define trimming, repeated whitespace, punctuation boundaries, case normalization, accent normalization, duplicate tokens, and token order.
- Use bind values for user input. Do not concatenate search text into the base SQL.
- `SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001` blocks generation unless exactly one semantic, positive integer bounds with `maxLen >= minChars`, every tokenization decision, and property-level compiler evidence are frozen in the Generation Plan.
- When the compiler has no property for a required behavior, keep it as a documented unresolved requirement and stop with Missing Inputs instead of inventing DSL or modifying the base SQL.
- Reject contradictory overrides, incomplete tokenization scope, unresolved compiler evidence, or `base_sql_rewrite: true` with `SMART_FILTER_SEARCH_BEHAVIOR_CONTRACT_REQUIRED_001`.

# Compiler-Gated Settings Contract

The requested UI contract is:

- `maxSuggestionChips: 100`
- `moreFiltersSuggestionChip: true`
- `compactNosThreshold: 10000`
- `showTotalRowCount`: an explicit boolean
- `totalRowCountLabel: Results` only when `showTotalRowCount` is `true`

Query active compiler metadata for every requested property. Emit a `settings` block only for properties exposed by the target build. `SMART_FILTER_SETTINGS_VALUE_REQUIRED_001` enforces each supported value and the conditional `Results` label. Missing compiler metadata stops with `SMART_FILTER_SETTINGS_COMPILER_EVIDENCE_REQUIRED_001`; unsupported properties stop with `SMART_FILTER_SETTINGS_UNSUPPORTED_001` until the target build or an approved alternative resolves the requirement. Never silently drop a requested setting or copy syntax from ticket prose.

# Security and Suggestion Contract

- The Smart Filters region and base region must have the same effective authorization scheme and server-side condition; both may be absent only when the page contract explicitly permits public access.
- Suggestions and refinements must derive from the same security-trimmed base dataset. Do not query a broader table, bypass a secured view, or omit tenant/row-level predicates.
- Prove every referenced object and searchable column through schema documentation, live metadata, or an exact user assertion.

# Performance Readiness Contract

- Record expected cardinality, current statistics status, and an index/search strategy aligned to each selected match semantic.
- Do not claim that a normal B-tree index solves substring `contains` searches. Record the proven text/function-based strategy or the accepted scan cost.
- Avoid wrapping searchable columns in functions unless matching function-based index evidence exists.
- Performance readiness remains unresolved while any required evidence is missing.
- `SMART_FILTER_PERFORMANCE_READINESS_REQUIRED_001` blocks generation while index strategy, statistics status, or expected-cardinality evidence is incomplete.
- For `contains`, reject a plain B-tree claim without text/function support or explicit accepted scan cost.

# Conditional Rendering Rules

- Use advanced DOM ids only when the selected scenario requires them.
- Emit categorical/range filter children only when their columns are in the base projection and their suggestion source satisfies the security contract.
- Set `totalRowCountLabel` only when `showTotalRowCount` is compiler-supported and true.

# Guardrails

- `baseRegionStaticId` is mandatory, unique on the page, and resolves to one APEX 24.2 Classic Report, Cards, Map, or Calendar base region.
- `searchableAttributes` is an explicit allowlist; never infer it from all projected columns or `select *`.
- Search filters use `source.dbColumns`; do not collapse free-text search into `source.databaseColumn`.
- Do not rewrite base SQL for match, tokenization, suggestions, or security. Store the original in `base_source.canonical_sql` and require an exact emitted match (ignoring outer whitespace).
- Match named object evidence to actual SQL objects or `tableName`; secured-view evidence must record `object_type: view` and `secured: true`.
- Traverse `filterGroup` and nested `checkbox` refinements for inherited authorization, conditions, base columns, and suggestion sources.
- `SMART_FILTER_BASE_SOURCE_CONTRACT_REQUIRED_001` blocks until source mode, object evidence, projection, and no-rewrite are recorded.
- Filter LOV/value definitions must be subsets of the base region's security-trimmed data.
- Metadata export lookup: search for `Smart Filters`, `filteredRegion`, the base static id, and child filter metadata.

# Validation Checklist

- Exactly one base region is resolved and its static id matches `source.filteredRegion`.
- Every searchable attribute is projected by the proven base source and no unlisted attribute is searchable.
- Match semantics, `minChars`, `maxLen`, and tokenization are explicit and consistent.
- Settings evidence is property-specific for the target compiler build.
- Authorization, conditions, suggestions, and refinements share the base security scope.
- Index strategy, statistics status, and expected cardinality evidence are recorded.
- Refinement/suggestion `source.type` is `static` or `distinctValues`/`base`; reject shared, SQL, function, and unknown shapes.
- Each search/refinement child has label/help; plan runtime acceptance sets `result_refresh_without_reload` and `filtered_exports` to `true`.
