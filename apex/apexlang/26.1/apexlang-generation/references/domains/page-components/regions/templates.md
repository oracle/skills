# Template & Rule References — Regions

## Authoritative Policies
- `references/policies/governance/00-governance.md`
- `references/policies/memory-bank/00-guard/ai.guard.md`
- `references/policies/memory-bank/10-global/apex.global.md`
- `references/policies/memory-bank/20-data/apex.sql.md`
- `references/policies/memory-bank/20-data/apex.logic.md`
- `references/policies/memory-bank/40-components/apex.templates.md`
- `references/policies/memory-bank/30-pages/apex.interactive-report.md`
- `references/policies/memory-bank/30-pages/apex.dashboard.md`
- `references/policies/memory-bank/30-pages/apex.chart-page.md`
- `references/policies/memory-bank/30-pages/apex.calendar.md`
- `references/policies/memory-bank/30-pages/apex.map-page.md`

## Operational References
### Region Templates
- `templates/page-examples/interactive-report-page/interactive-report-page._index.md`
- `templates/page-examples/dashboard-page/dashboard-page._index.md`
- `templates/region-components/chart/chart._common.md`
- `templates/page-examples/calendar-page/calendar-page._index.md`
- `templates/page-examples/map-page/map-page._index.md`
- `templates/region-components/static-content/static-content._common.md`
- `templates/region-components/breadcrumb/breadcrumb._common.md`
- `templates/region-components/collapsible-region/collapsible-region._common.md`
- `templates/region-components/dynamic-content/dynamic-content._common.md`
- `templates/region-components/interactive-report/interactive-report._common.md`
- `templates/region-components/interactive-grid/interactive-grid._common.md`
- `templates/region-components/interactive-grid/interactive-grid.standard.md`
- `templates/region-components/interactive-grid/interactive-grid.region.md`
- `templates/region-components/interactive-grid/interactive-grid._saved-report._common.md`
- `templates/region-components/interactive-grid/interactive-grid._columns._common.md`
- `templates/page-examples/interactive-grid/interactive-grid._index.md`
- `templates/region-components/cards/cards._common.md`
- `templates/region-components/chart/chart._common.md`
- `templates/region-components/calendar/calendar._common.md`
- `references/domains/page-components/regions/calendar/workflow-calendar-link-targets.md`
- `templates/region-components/map/map._common.md`
- For map work, use the attached canonical attribute vocabulary: `initialPositionAndZoom`, layer `source { ... }`, `columnMapping.geometryColumnDataType`, and `body` where the page pattern calls for it.
- Prefer `source { tableName: ... }` for the baseline path, emit typed `source.type: sqlQuery` for new SQL-backed layers, and reserve `source.type: functionBody` for advanced fallback cases.
- `templates/region-components/region-display-selector/region-display-selector._common.md`
- `templates/region-components/search-config/search-config._common.md`
- `templates/region-components/smart-filter-search/smart-filter-search._common.md`
- `templates/business-logic/dynamic-actions/dynamic-actions.refresh-region-after-dialog.md`
- `templates/business-logic/dynamic-actions/dynamic-actions.execute-server-side-code.md`

Load only relevant files per region type using `assets/rules-mapping.json`.
