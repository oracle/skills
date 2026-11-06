---
templateId: map.index
componentType: template
version: 1.1
imports:
  - map._common.md
  - map.layer._common.md
description: Routing entrypoint for map templates.
---

# Purpose

Primary routing entrypoint for `map` templates.

# Load Groups

- Family contract: `map._common.md`
- Layer contract: `map.layer._common.md`
- Baseline region scenario: `map.standard.md`
- Page-example entrypoint when the request is page-scaffold-first: `../../page-examples/map-page/map-page._index.md`
- Region scenarios:
  - `map.region.background-custom.md`
  - `map.region.background-shared.md`
  - `map.region.init-position-sql.md`
  - `map.region.bbox-static.md`
  - `map.region.bbox-sql.md`
  - `map.region.browser-location.md`
- Geometry qualifier files (load one per map region):
  - `map.longitude-latitude.md`
  - `map.sdo-geometry.md`
  - `map.geojson.md`
- Layer scenarios:
  - `map.layer.points.md`
  - `map.layer.points.sql-query.md`
  - `map.layer.points.function-body.md`
  - `map.layer.lines.md`
  - `map.layer.polygons.md`
  - `map.layer.heat-map.md`
  - `map.layer.extruded-polygons.md`
- Companion references:
  - `map.backgrounds.md`
  - `map.runtime-api.md`

# Load Order

1. Load this file.
2. Load `map._common.md`.
3. Load `map.layer._common.md` when authoring one or more `layer` blocks.
4. Load one region scenario template in this folder.
5. Load one or more layer scenario templates when the chosen region needs non-standard layer behavior.
7. Load `map.backgrounds.md` when `tileLayerType` uses shared backgrounds.
8. Load `map.runtime-api.md` only for browser-side API or event behavior.

When the request starts from a page pattern rather than a standalone map region, route through `../../page-examples/map-page/map-page._index.md` first and preserve the attached-style structure: `body`, `initialPositionAndZoom`, declarative `source { ... }`, and `columnMapping.geometryColumnDataType`. Keep table-backed layers as the standard baseline, emit typed `source.type: sqlQuery` for new SQL-backed layers, and reserve `source.type: functionBody` for advanced fallback cases.
