---
templateId: region.faceted-search.common
componentType: region
version: 1.2
description: Shared contract for left-column faceted-search regions and results region wiring.
---

# Purpose

Document the native faceted-search region shell and its filter child metadata boundary. Define required wiring between the faceted-search region and its filtered results region for the standard left-column faceted-search page pattern.

# Generation Rules (MANDATORY)

1. Use the dedicated `region-faceted-search` template.
2. Treat the filtered-region reference as mandatory.
3. Document facets as separate child metadata from the region shell.
4. Default the faceted-search region shell to `appearance.template: @/standard` unless a page pattern documents a deliberate exception.
5. Default the faceted-search region layout to the left-column slot (`leftColumn`) for the standard page pattern; do not model the sidebar with `body` `columnSpan` coordinates.
6. Emit child facets with `facet (...)` blocks in this family.
7. Use the canonical emitted facet type values from the checked-in example set: `search`, `checkboxGroup`, `radioGroup`, `selectList`, and `range`.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Region identifier. |
| name | yes | string | Display name. |
| resultsRegionStaticId | yes | string | Static id of target results region. |
| searchRegionStaticId | yes | string | Static id of faceted-search region. |
| source.filteredRegion | yes | ref | Must reference results region id. |
| layout.slot | optional | string | Default to `leftColumn` for the standard pattern. |
| appearance.template | optional | string | Default to `@/standard`. |
| compactNosThreshold setting | yes | number | Standard default is `10000`. |
| showCurrentFacets setting | yes | boolean/string | Standard default is `true`; use `selector` only for explicit selector-mode requests. |
| showTotalRowCount setting | yes | boolean | Standard default is `true`. |
| displayChartForTopNValues setting | optional | positive integer | Opt-in only for explicit chart/top-N requests; common value is `10`. |
| currentFacetsSelector setting | conditional | selector | Required only when `showCurrentFacets: selector` is emitted. |
| facets | optional | array | Facet definitions and LOV/source metadata. |
| searchFacet.enabled | optional | boolean | Enables free-text facet search. |

## Facet Child Contract

- Child block name: `facet (...)`
- Canonical emitted `type` values:
  - `search`
  - `checkboxGroup`
  - `radioGroup`
  - `selectList`
  - `range`
- For discrete facets (`checkboxGroup`, `radioGroup`, `selectList`), prefer:
  - `lov { type: distinctValues }`
- For `checkboxGroup` and `radioGroup` facets, emit:
  - `listEntries { maxDisplayedEntries: 10 }`
  - add `displayFilterInitially: true` when the facet can have many values, especially Product, Customer, Store, Assignee, Owner, User, Employee, Supplier, Email, SKU, name, or title facets
- For free-text search facets, use:
  - `source { dbColumns: COL_A,COL_B,... }`
- For range facets, use:
  - `source { databaseColumn: <col> dataType: number|date }`
- For date/time facets, use `dataType: date` even when the schema column is `TIMESTAMP`; the facets runtime expects the date facet type, not `timestamp` or `varchar2`.
- For string/discrete facets, omit `source.dataType`; never emit `varchar2`, `VARCHAR2`, `STRING`, or report-column data type labels in faceted-search facet sources.

## Minimal Child Examples

```apexlang
facet P7_F_SEARCH (
  type: search
  label {
    label: Search
  }
  layout {
    sequence: 10
  }
  source {
    dbColumns: PRODUCT_NAME,STORE_NAME
  }
)

facet P7_F_STATUS (
  type: selectList
  label {
    label: Order Status
  }
  lov {
    type: distinctValues
  }
  layout {
    sequence: 20
  }
  source {
    databaseColumn: ORDER_STATUS
  }
)

facet P7_F_PRODUCT (
  type: checkboxGroup
  label {
    label: Product
  }
  lov {
    type: distinctValues
  }
  layout {
    sequence: 25
  }
  listEntries {
    maxDisplayedEntries: 10
    displayFilterInitially: true
  }
  source {
    databaseColumn: PRODUCT_NAME
  }
)

facet P7_F_ORDER_DATE (
  type: range
  label {
    label: Order Date
  }
  layout {
    sequence: 30
  }
  source {
    databaseColumn: ORDER_DATETIME
    dataType: date
  }
)
```

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: facetedSearch
  source {
    filteredRegion: @{{source.filteredRegion}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: #DEFAULT#
  }
  settings {
    compactNosThreshold: 10000
    showCurrentFacets: true
    showTotalRowCount: true
  }
  {{facets}}
)
```

# Conditional Rendering Rules

- Emit the standard three-property `settings` block by default: `compactNosThreshold: 10000`, `showCurrentFacets: true`, and `showTotalRowCount: true`.
- Keep current-facets selector configuration in `settings`, but only for explicit selector-mode requests.
- When selector mode is requested, emit both `showCurrentFacets: selector` and a concrete `currentFacetsSelector` value. Do not invent an external target unless the generated page also creates a clearly named target.
- Emit `displayChartForTopNValues` only for explicit chart/top-N requests; use a positive integer such as `10`.
- Do not merge facet child definitions into the region shell description.
- The standard page-level composition for this region family is breadcrumb in `breadcrumbBar`, results in `body`, and faceted search in `leftColumn`.
- When the request calls for Product, Store, Status, or other discrete value filters, start from `selectList`, `checkboxGroup`, or `radioGroup` plus `lov { type: distinctValues }` instead of internal `NATIVE_*` token guessing.

# Guardrails

- `filteredRegion` must reference an existing results region.
- Facet columns must exist in the results region source query.
- Facet names must be page-scoped and collision-safe (for example `P{page}_FACET_*` or `FS_*`); avoid generic names like `FACET_SEARCH`.
- `listEntries.maxDisplayedEntries` is allowed only when facet `type` is `checkboxGroup` or `radioGroup`.
- For `checkboxGroup` and `radioGroup` facets, set `listEntries.maxDisplayedEntries`; default to `10` and keep deliberate values between `5` and `15`.
- For high-cardinality value lists, set `listEntries.displayFilterInitially: true`.
- For all other facet types (including `range`), omit the `listEntries` block.
- Facet source data types are not generic SQL metadata. Use only `date` for date/time facets and `number` for numeric facets. Omit `source.dataType` for string facets so the runtime does not receive unsupported `VARCHAR2` facet metadata.
- Do not emit internal runtime tokens such as `NATIVE_SEARCH` or `NATIVE_SELECT_LIST` in APEXlang unless a compiler-validated example explicitly requires them; the canonical emitted DSL in this repo uses the simple type names above.
- Keep facet definitions declarative; avoid custom JS unless required.
- Do not use `slot: body` plus `columnSpan` values for the canonical faceted-search sidebar.
- Do not assume a page-header wrapper region; breadcrumb placement belongs directly in `breadcrumbBar` for the standard pattern.
- Metadata export lookup: search for `Faceted Search`, the filtered-region reference, and child facet metadata.
