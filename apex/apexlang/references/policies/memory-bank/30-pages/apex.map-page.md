## Map Page Standards

### Purpose
- Ensure map pages use a consistent layout, Universal Theme template, and map region configuration.

### Rules (Non-Negotiable)
1. Set `pageTemplate: @/standard` with `templateOptions: #DEFAULT#`.
2. Main region must be `type: map` (or the appropriate map plug-in) with `appearance.template: @/standard`.
3. Define map attributes (controls, `initialPositionAndZoom`, layer `source { ... }`, tooltip/info-window, and `columnMapping.geometryColumnDataType`) exactly as shown in `page-examples/map-page/map-page.example.md` and the `region-components/map/*` family.
4. Apply navigation/breadcrumb requirements from `apex.page.md`.
5. For `initialPositionAndZoom.type: sqlQuery`, the SQL select-list aliases must exactly match every configured `initial*Column` name. If `initialZoomlevelColumn` is emitted, the SQL must return that alias too.
6. Multi-marker maps must use a viewport that fits the marker set. Do not center on `avg(latitude)` / `avg(longitude)` with a fixed zoom such as `4 as zoom_level`; that focuses the map on an arbitrary example location and can hide outlying points.
7. Prefer a SQL-derived `boundingBox` from `min(longitude)`, `min(latitude)`, `max(longitude)`, and `max(latitude)` for table-backed multi-marker maps. Omit `infiniteMap` when authoring a bounding box because that feature disables bounding-box metadata.
8. Use `initialPositionAndZoom` with a fixed zoom only when requirements explicitly identify one known geography or single-location viewport.
9. Map layers that depend on same-page context must use live-valid refresh/session-state patterns for the active compiler. Do not emit unsupported map-layer `source.pageItemsToSubmit`, and do not use `v('P...')`, `nv('P...')`, or string-concatenated session-state workarounds.
10. When requirements say marker selection opens a form, the map layer must include a declarative `link { target: { page, items } }` that passes the marker primary key, and `columnMapping.primaryKeyColumn` must identify the marker key column.

### Guidance
- Mirror `templates/page-examples/map-page/map-page.example.md` for page-level structure, `body` slot usage, SQL-driven `initialPositionAndZoom`, and the standard table-backed layer pattern.
- Use `templates/region-components/map/*` for the concrete map-region and map-layer attribute vocabulary, including `geometryColumnDataType: longitudeLatitude`.
- In SQL-driven initial positioning, treat `initialLongitudeColumn`, `initialLatitudeColumn`, and optional `initialZoomlevelColumn` as references to the SQL output alias names, not to the source table column names.
- For broad store/customer/location maps, start from `map.region.bbox-sql.md` rather than fixed-zoom initial positioning. A typical longitude/latitude bounds query returns `min(longitude) as min_lon`, `min(latitude) as min_lat`, `max(longitude) as max_lon`, and `max(latitude) as max_lat` over the same filtered dataset used by the layer.
- Map-layer source modes are:
  - `source { tableName: ... }` for the preferred baseline
  - `source { type: sqlQuery sqlQuery: ... }` for new SQL-backed layers
  - `source { type: functionBody plsqlFunctionBody: ... }` for advanced fallback cases
- Legacy bare `source { sqlQuery: ... }` remains accepted for existing artifacts during transition, but new SQL-backed examples should use `source.type: sqlQuery`.
- When combining maps with Smart Filters, target a companion report/cards results region and refresh the sibling map explicitly. Do not point Smart Filters directly at the map region.
- In master-detail map pages, the parent selector must refresh the map and any sibling detail report after changing the selected context item.
