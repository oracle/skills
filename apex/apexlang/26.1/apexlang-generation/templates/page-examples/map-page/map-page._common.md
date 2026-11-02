---
pageExampleId: map-page
componentType: page
version: 1.0
canonicalExample: ./map-page.example.md
---

# Purpose
Shared page-level contract for the map-page example family.

# Load Order
1. Load `./map-page._index.md`.
2. Load this file.
3. Load `./map-page.example.md` for concrete APEXlang syntax.
4. Load [`../../region-components/map/map._index.md`](../../region-components/map/map._index.md) when the request needs map-region, map-layer, shared-background, or runtime API detail beyond the page pattern.

# Pattern Variants
| Variant | Page shell | Map source ownership | Notes |
|---------|------------|----------------------|-------|
| Standard map page | Existing page shell chosen earlier in the page wizard. The canonical example uses `@/standard`. | The first `layer` owns declarative source metadata through `source { tableName: ... }`, `source { type: sqlQuery sqlQuery: ... }`, or `source { type: functionBody plsqlFunctionBody: ... }`. | Created through `wwv_flow_map_region_dev.create_map_page`. |
| Faceted-search map page | Universal Theme uses `@/left-side-column` so filters can live in `leftColumn`. | The result region owns the result set while the child `layer` still follows the family’s declarative source and `columnMapping` structure. | Routed through `wwv_flow_faceted_search_dev.create_faceted_search_page` with `c_result_region_map`. |

# Rules
- Keep map-page.example.md as canonical Markdown-preserved example for this page pattern.
- Use this file for page-pattern guidance only; use the region-component map family for concrete region and layer syntax.
- Apply only the component templates/rules required by the user prompt.
- Do not copy optional regions/items/processes unless requested.

# Standard Map Page Contract
- The page shell is chosen first. The canonical baseline uses `@/standard`, but the map scaffold is the `type: map` region, not a hard requirement on one page template.
- The map region sits in `body`.
- The create-page scaffold always seeds exactly one child `layer`.
- The standard region uses `initialPositionAndZoom { ... }` for viewport setup.
- For the standard variant, the first child layer owns its source directly through `source { tableName: ... }`, typed `source { type: sqlQuery sqlQuery: ... }`, or typed `source { type: functionBody plsqlFunctionBody: ... }`.

# Faceted-Search Map Page Contract
- Universal Theme faceted-search map pages use `@/left-side-column` so the filter region can occupy `leftColumn`.
- The map result region still uses `type: map` and follows the map family’s `initialPositionAndZoom` and `columnMapping.geometryColumnDataType` structure.
- For the faceted-search variant, keep the result region wiring aligned with the faceted-search family while preserving the same map-layer attribute vocabulary.
- This family documents the map result pattern only. Full faceted-search region syntax remains in the faceted-search page-example family.

# Scaffold Behavior
- Standard map pages create the page shell first, then add one map region in `body`, then add one child `layer` whose default name follows the page name.
- Faceted-search map pages route through `wwv_flow_faceted_search_dev.create_faceted_search_page`.
- The faceted-search result region title is seeded from the Builder message `APEX.MAPS.MAP`, while the child layer name still comes from the supplied page name.
- Additional layers, shared backgrounds, legend refinements, popup behavior, and runtime APIs are follow-up authoring work after the page scaffold.

# Conditional Rules
- `columnMapping.geometryColumnDataType: longitudeLatitude` requires both `longitudeColumn` and `latitudeColumn`.
- `columnMapping.geometryColumnDataType: sdoGeometry` and `columnMapping.geometryColumnDataType: geojson` use the single `geometryColumn` path.
- `initialPositionAndZoom.geometryColumnDataType: longitudeLatitude` requires `initialLongitudeColumn` and `initialLatitudeColumn`.
- `initialPositionAndZoom.geometryColumnDataType: sdoGeometry` and `geojson` use the matching single-column initial-position path.

# Guardrails
- The create-page scaffold always creates exactly one initial `layer`.
- Standard map pages may reuse different page shells chosen earlier in the wizard; `@/standard` is the common baseline, not a map-only requirement.
- The faceted-search variant forces normal page mode even when the public non-faceted create-page API accepts a page-mode argument.
- Keep the standard example on the simpler declarative layer shape from `MapsLang.apx`: `layout`, `source`, `columnMapping`, and optional `tooltip`.
- Keep `tableName` as the preferred simple baseline. For new SQL-backed layers, prefer typed `source.type: sqlQuery`; reserve typed `source.type: functionBody` for advanced fallback use.

# Source Anchors
- `builder/f4000/application/pages/page_02506.sql`
- `core/modules/create_app_wiz/wwv_flow_create_app.plb`
- `core/wwv_flow_map_region_dev.sql`
- `core/wwv_flow_map_region_dev.plb`
- `core/wwv_flow_faceted_search_dev.plb`
