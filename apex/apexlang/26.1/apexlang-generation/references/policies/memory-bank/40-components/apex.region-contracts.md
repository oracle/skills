# APEX Region Contracts

## Purpose
Index for cross-region APEXlang contracts that apply before component-specific templates. Use this file first for region selection and invariant routing, then load the specialized files for data-source, media/BLOB, and interaction/filter details.

## Canonical Region Selection
- Choose the narrowest native APEX region that satisfies the request; do not add helper or summary regions unless the prompt or a dependency requires them.
- Prefer `Interactive Report` for user-driven search, personalization, saved reports, and ad hoc analysis.
- Prefer `Classic Report` for stable tabular output, contextual info, printable summaries, and report fragments with fixed columns.
- Prefer `Cards` or `Content Row` for browse/list experiences where a row is primarily represented as a title, subtitle, image, badge, or short description.
- Prefer `Metric Card` for single numeric KPIs and `Chart` for aggregate trend/category visualization; connect drilldown through nearby report/card links rather than chart or metric actions.
- Prefer `Faceted Search` for structured filter panels over known columns and `Smart Filters` for compact keyword/filter search experiences.

## Core Invariants
- Region type must come from the active APEXlang templates and component attribute catalogs; do not invent aliases.
- Emit qualifiers only where the region contract supports them. `Classic Report` supports `Standard` and `Contextual Info`; `Chart`, `Map`, and `List` require their valid qualifier; most other region types omit qualifier.
- `breadcrumb-bar` is reserved for non-modal `Classic Report` regions with `Qualifier: Contextual Info`; modal dialog pages must not use `breadcrumb-bar`.
- Region `Position` must be one of the template-supported positions for the page and region; do not move regions to satisfy invalid block combinations.
- `Data Source Type: Static` is not a valid data source for data-backed APEXlang region components; use static-content templates for static UI sections.

## Specialized Files
- `references/policies/memory-bank/40-components/apex.region-data-source.md`: table/view/SQL source semantics, schema UI hints, order-by ownership, and display/format mask guidance.
- `references/policies/memory-bank/40-components/apex.region-media.md`: BLOB display, storage companion columns, file/image upload constraints, icon allowlists, and visual-token rules.
- `references/policies/memory-bank/40-components/apex.region-interactions.md`: Cards/List/Metric/Chart action rules, filter/search namespaces, contextual info, parent-child layout, and comments.

Tags: apexlang, region, qualifier, data-source, blob, contextual-info, faceted-search, smart-filters, cards, metric-card, chart, list
