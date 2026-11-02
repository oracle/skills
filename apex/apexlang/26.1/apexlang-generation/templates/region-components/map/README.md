# Map Templates

## Purpose
Canonical guidance for the `map` region family, including shared contract loading, region scenarios, layer scenarios, shared backgrounds, page-pattern handoff, and runtime references.

## Baseline
- This family documents the Oracle APEX Maps surface using the attached `MapsLang.apx` structure as the canonical baseline for standard page and region authoring.
- Layer navigation uses `linkTargetType` plus helper payloads under the `LINK_TARGET_` prefix (`linkTargetInApp`, `linkTargetInDiffApp`, `linkTargetUrl`).
- Page-pattern guidance lives in the map-page page-example family and hands off to this folder for region, layer, background, and runtime detail.

## Usage
- Load `map._index.md` first.
- Load `map._common.md` for the family-wide contract.
- Load `map.layer._common.md` when authoring one or more `layer` blocks.
- Load `../../page-examples/map-page/map-page._index.md` first when the request is about a full map page scaffold rather than a standalone map region.
- Preserve the attached declarative structure for the standard path: `body`, `initialPositionAndZoom`, `source { ... }`, and `columnMapping.geometryColumnDataType`.
- Map-layer source modes are:
  - `source { tableName: ... }` for the preferred simple path
  - `source { type: sqlQuery sqlQuery: ... }` for new SQL-backed layers
  - `source { type: functionBody plsqlFunctionBody: ... }` for advanced fallback cases
- Legacy bare `source { sqlQuery: ... }` remains accepted for existing artifacts during transition, but new examples in this family should emit the typed SQL form.
- Choose the region scenario that matches the requested behavior.
- Add one or more layer scenario files when the map needs non-standard layer behavior.
- Load `map.runtime-api.md` only for browser-side API or event requests.

## Template Catalog
- `map._index.md`
- `map._common.md`
- `map.layer._common.md`
- `map.standard.md`
- `map.region.background-custom.md`
- `map.region.background-shared.md`
- `map.region.init-position-sql.md`
- `map.region.bbox-static.md`
- `map.region.bbox-sql.md`
- `map.region.browser-location.md`
- `map.layer.points.md`
- `map.layer.points.sql-query.md`
- `map.layer.points.function-body.md`
- `map.layer.lines.md`
- `map.layer.polygons.md`
- `map.layer.heat-map.md`
- `map.layer.extruded-polygons.md`
- `map.backgrounds.md`
- `map.runtime-api.md`

## Maintenance
- Keep this README synchronized with the actual files in the folder.
- Keep scenario files narrowly scoped; shared contract material belongs in `map._common.md` or `map.layer._common.md`.
- Keep `map.backgrounds.md` focused on the `mapBackground` shared component family.
- Keep `map.runtime-api.md` explicitly runtime-only and out of declarative DSL templates.
