---
templateId: region.map.common
componentType: region
version: 1.1
description: Shared family contract for Oracle APEX map regions. Covers the region shell and qualifier-dependent geometry mapping (sdoGeometry, geojson, longitudeLatitude).
---

# Purpose

Standardize the Oracle APEX Maps surface using the attached `MapsLang.apx` structure as the canonical declarative pattern for page-level and region-level map authoring in this repo.

---

# Generation Rules (MANDATORY)

1. Load `references/policies/memory-bank/30-pages/apex.map-page.md` before drafting map-region output.
2. Keep region and layer guidance separated; layer-specific contracts belong in `map.layer._common.md` and `map.layer.*.md`.
3. Use `map.standard.md` for the default single-layer point map, and load focused scenario files only when the request needs them.
4. Keep output templates variable-driven; sample values belong in prose examples, not in reusable skeletons.
5. Treat geometry mapping as explicit declarative metadata using `geometryColumnDataType`.
6. Default map regions to `appearance.template: @/standard` unless a documented scenario explicitly requires another shell.

---

# Component Family

| Component | Repo anchor | APEXlang target | Notes |
|----------|-------------|-----------------|-------|
| Map page pattern | `core/modules/create_app_wiz/wwv_flow_create_app.plb`, `core/wwv_flow_map_region_dev.sql` | `page (...)` scaffold containing a `type: map` region | Builder/Create Page pattern that seeds one map region and one initial layer. |
| Map region | `builder/f4411/application/shared_components/plugins/region_type/map_region.sql` | `region (...)` with `type: map` | Native region plugin `MAP_REGION`. |
| Map layer | `core/apex_install_pe_data.sql` (`MAP_LAYER`) | `layer (...)` child block | One or more layers under a map region. |
| Map background | `core/apex_install_pe_data.sql` (`MAP_BACKGROUND`) | `mapBackground (...)` shared component | Referenced from a region when `tileLayerType` uses shared backgrounds. |
| Runtime region API | `images/libraries/apex/widget.spatialMap.js` | `apex.region( regionId )` | JS-only surface for runtime manipulation and events. |

---

# Shared Compatibility Rules

| Concern | Supported contract |
|--------|--------------------|
| Built-in background mode | `tileLayerType` = `default` or `custom` using built-in background maps. |
| Shared background mode | `tileLayerType` = `shared`, selecting one or two `mapBackground` shared components. |
| Layer source | Declarative child-layer `source` supports three modes: `tableName`, typed `sqlQuery`, and typed `functionBody`. |
| Local geometry types | `longitudeLatitude`, `sdoGeometry`, or `geojson`. |
| Remote geometry types | `geojson` and `longitudeLatitude`. |
| Layer types | Multiple layer scenarios remain supported; use the scenario file that matches the requested shape. |
| Initial position modes | `staticValues`, `sqlQuery`, or `queryResults`. |
| Bounding box modes | none, `staticValues`, or `sqlQuery`. |

---

# Naming Rules

- Region examples use `type: map`.
- Child layer examples use `layer`.
- Shared background examples use `mapBackground`.
- Shared link-helper examples use `linkTargetType` plus lower-camel helper names derived from `LINK_TARGET_IN_APP`, `LINK_TARGET_IN_DIFF_APP`, and `LINK_TARGET_URL`.
- Enum spellings follow explicit `p_apexlang_name` overrides when present:
  - bbox type: `staticValues`, `sqlQuery`
  - map background type: `raster`, `vector`
- Boolean examples use `true` and `false`, matching the repo seed metadata overrides.

---

# Region-Level Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| `regionStaticId` | yes | string | Identifier used after the `region` keyword. |
| `name` | yes | string | Builder display name. |
| `layout.sequence` | yes | number | Region order in the page slot. |
| `layout.slot` | yes | enum | Slot the region occupies. |
| `appearance.template` | optional | string | Default to `@/standard`. |
| `map.height` | optional | number | Map widget height emitted inside `map { height: ... }`. |
| `tileLayerType` | optional | enum | `default`, `custom`, or `shared`. |
| `standardTileLayer` | conditional | enum or component ref | Built-in background for `custom`, or shared `mapBackground` for `shared`. |
| `darkModeTileLayer` | optional | enum or component ref | Optional dark-mode override. |
| `navigationBarType` | optional | enum | `none`, `small`, or `full`. |
| `navigationBarPosition` | conditional | enum | `start` or `end`; only when navigation bar is not `none`. |
| `controls.options` | optional | list | Region feature list such as `scaleBar`, `browserLocation`, or `infiniteMap`. |
| `initialPositionAndZoom` | optional | block | SQL-driven or static viewport contract for the initial map position. |
| `boundingBox` | optional | block | Static or SQL-derived viewport bounds. For static bounds, emit `type`, `minLongitude`, `minLatitude`, `maxLongitude`, and `maxLatitude` inside the block. Hidden when `infiniteMap` is enabled. |
| `showLegend` | optional | boolean | Region-level legend toggle. |
| `legendPosition` | conditional | enum | `start`, `end`, or `selector`. |
| `attributes.messagesPosition` | optional | enum | `above`, `below`, or `selector`. |
| `unitSystem` | optional | enum | `metric`, `imperial`, or `item`. |
| `lazyLoading` | optional | boolean | Required for per-layer vector tiles. |
| `customStyles` | optional | text | Custom SVG shape definitions used by point layers. |
| `layers` | conditional | list | One or more child `layer` blocks. |

---

# Cross-Surface Guardrails

- Distinguish the two vector-tile controls:
  - app/plugin-level `useVectorTileLayers` governs supported built-in background maps
  - per-layer `useVectorTiles` governs feature-data fetching as PBF vector tiles
- `useVectorTiles` is a layer data-fetch optimization. It is not a styling shortcut and does not relax source-location or geometry restrictions.
- `queryResults` initial positioning is intentionally still visible even though it conflicts with `useVectorTiles`; Builder enforces the rejection through callback validation rather than by hiding the property.
- `INFINITE_MAP` disables bbox authoring metadata.
- Multi-marker maps should fit the data, not center on an average point. Do not use `avg(latitude)` / `avg(longitude)` with a fixed zoom level for store/customer/location maps; use `boundingBox` with min/max coordinates or another query-results viewport pattern.
- Fixed `initialZoomlevelColumn` values are appropriate only for a requirement-backed single geography or known one-location viewport.
- `MAP_HAS_SPATIAL_INDEX` is a performance hint, not a guarantee that a spatial index will always be used.
- The layer link contract uses `linkTargetType` plus helper properties under the `LINK_TARGET_` prefix rather than a single raw `linkTarget` payload.
- Runtime mutation methods and popup helpers must be documented separately from declarative metadata because they exist only after the widget initializes in the browser.
- Child map layers keep `tableName` as the preferred standard path. For non-table sources, emit `source.type: sqlQuery` with `source.sqlQuery`, or `source.type: functionBody` with `source.plsqlFunctionBody` for advanced fallback cases. Legacy bare `source.sqlQuery` remains accepted for backward compatibility but is not the preferred emitted form for new examples.

---

# Geometry Mapping Vocabulary

Use `geometryColumnDataType` in the attached-style map contracts:

| Value | Meaning |
|-------|---------|
| `longitudeLatitude` | Separate longitude and latitude columns. |
| `sdoGeometry` | One spatial geometry column. |
| `geojson` | One GeoJSON column. |

## Region Shell Output Template

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: map
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: @/standard
    templateOptions: #DEFAULT#
  }
  {{layer}}
)
```

- Keep controls and region attributes on the region shell and keep geometry mapping inside `initialPositionAndZoom` and `columnMapping`.
- Metadata export lookup: search for `Map` plus the attached-style block names such as `initialPositionAndZoom`, `source`, and `columnMapping`.

---

# Source Anchors

- `core/apex_install_pe_data.sql`
- `core/modules/create_app_wiz/wwv_flow_create_app.plb`
- `builder/f4411/application/shared_components/plugins/region_type/map_region.sql`
- `core/wwv_flow_map_region.sql`
- `core/wwv_flow_map_region_dev.sql`
- `core/wwv_flow_spatial_api.sql`
- `images/apex_ui/js/pe.callbacks.js`
- `images/libraries/apex/widget.spatialMap.js`
