---
templateId: map.backgrounds
componentType: template
version: 1.0
description: Shared Oracle APEX map-background guidance covering raster, vector, and OGC WMS backgrounds plus API-key and subscription behavior.
---

# Purpose

Document the `mapBackground` shared component family: raster XYZ tile layers, vector tile-layer style definitions, OGC WMS backgrounds, API-key derivation, HTTP headers, zoom limits, and subscription behavior.

---

# Variable Contract

| Name | Required | Type | Description |
|------|----------|------|-------------|
| `name` | yes | string | Shared-component display name. |
| `staticId` | yes | string | Application-unique static ID. |
| `type` | yes | enum | `raster`, `vector`, or OGC WMS. |
| `url` | yes | string | Background URL. |
| `attribution` | conditional | text | Used for raster and OGC WMS backgrounds. |
| `apiKey.type` | optional | enum | `staticValue` or `webCredential`. |
| `apiKey.staticValue` | conditional | string | Static API-key value. |
| `apiKey.webCredential` | conditional | credential ref | URL Query String Web Credential. |
| `httpHeaders` | optional | text | Key-value pairs, one per line. |
| `minZoomLevel` / `maxZoomLevel` | optional | number | Background zoom limits. |
| subscription fields | optional | subscription | Shared-component subscription metadata. |

---

# Template

```apexlang
mapBackground {{staticId}} (
  name: {{name}}
  type: {{type}}
  url: {{url}}
  attribution: {{attribution}}
  apiKey: {{apiKey.type}}
  staticValue: {{apiKey.staticValue}}
  webCredential: @{{apiKey.webCredential}}
  httpHeaders: {{httpHeaders}}
  advanced {
    staticId: {{staticId}}
    minZoomLevel: {{minZoomLevel}}
    maxZoomLevel: {{maxZoomLevel}}
  }
)
```

---

# Region Reference Guidance

Use shared backgrounds from a map region when `tileLayerType` selects the shared-component path. The region then chooses one background for standard mode and optionally another for dark mode through the shared background references.

---

# Guardrails

- `type: vector`
  - The URL must point to a `style.json`-style definition for the vector tile layer.
- `type: raster`
  - The URL should resolve XYZ tiles and may include the `{api-key}` placeholder.
- OGC WMS
  - Provide the URL with the required WMS parameters except `BBOX`, `WIDTH`, `HEIGHT`, `REQUEST`, `FORMAT`, and `SRS/CRS`; the map region adds those automatically.
- `attribution` only applies to raster and OGC WMS backgrounds in the current seed metadata.
- `apiKey: webCredential`
  - The credential must be a URL Query String Web Credential.
- Background vector-tile usage is still subject to the application-scoped native plugin setting `useVectorTileLayers`.

---

# Source Anchors

- `core/apex_install_pe_data.sql`
- `core/wwv_flow_imp_shared.sql`
- `core/gen_api_pkg.plb`
- `core/wwv_flow_map_region_dev.sql`
