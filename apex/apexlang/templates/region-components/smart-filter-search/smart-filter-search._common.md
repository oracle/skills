---
templateId: region.smart-filters.common
componentType: region
version: 1.1
description: Shared contract for smart-filters regions and target result region binding.
---

# Purpose

Document the native smart-filters region shell and its filter child metadata boundary.

# Generation Rules (MANDATORY)

1. Use the dedicated `region-smart-filters` template.
2. Treat the filtered-region reference as mandatory.
3. Do not emit region `settings` for Smart Filters unless active compiler metadata proves a valid settings group.
4. Use the canonical search-filter source contract with `source.dbColumns` for free-text search; do not invent single-column shortcut shapes.
5. Do not target map regions directly. For map pages, target a companion report/cards results region and refresh the sibling map explicitly.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Region identifier. |
| name | yes | string | Display name. |
| smartFiltersRegionStaticId | yes | string | Smart filters region static id. |
| source.filteredRegion | yes | ref | Results region static id. |
| filters | optional | array | Filter definitions (radio/search/etc). |
| filter.itemName | conditional | string | Canonical page item name for child search filters, e.g. `P14_F_SEARCH`. |

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: smartFilters
  source {
    filteredRegion: @{{source.filteredRegion}}
  }
  {{filters}}
)
```

# Output Template – Search Filter Child

```apexlang
filter {{filter.itemName}} (
  type: search
  label {
    label: {{filter.label}}
  }
  layout {
    sequence: {{filter.layout.sequence}}
  }
  source {
    dbColumns: {{filter.source.dbColumns}}
  }
)
```

# Conditional Rendering Rules

- Keep filter children separate from the shell.
- Use the advanced HTML DOM ID only when the owning scenario requires it.
- Omit `settings` blocks for APEX 26.1 Smart Filters; the live compiler metadata for `NATIVE_SMART_FILTERS` has no settings group.

# Guardrails

- `filteredRegion` must reference an existing results region with compatible source columns.
- The Smart Filters region must be declared before the referenced `filteredRegion` in the page file.
- `filteredRegion` must reference a report/cards-style results region. Do not target map regions, map layers, Smart Filters regions, Faceted Search regions, or other non-results aliases.
- Filter LOV/value definitions must match result columns.
- Search filters must use `source.dbColumns`; do not collapse free-text search into `source.databaseColumn`.
- Metadata export lookup: search for `Smart Filters`, the filtered-region reference, and child filter metadata.
