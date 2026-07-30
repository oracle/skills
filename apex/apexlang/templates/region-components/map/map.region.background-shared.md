---
templateId: region.map.background-shared
componentType: region
version: 1.0
imports:
  - map._common.md
  - map.backgrounds.md
description: Map region scenario referencing shared mapBackground components.
---

# Purpose

Document the region-level background path where `tileLayerType` uses shared `mapBackground` components.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `layout.sequence`
- `layout.slot`
- `map.background` (use `sharedComponent`)
- `map.standard`

## Optional Variables

- `map.darkMode`
- `map.height`
- `controls.options`
- `legend.show`
- `performance.lazyLoading`

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: map
  map {
    background: sharedComponent
    standard: @{{map.standard}}
    darkMode: @{{map.darkMode}}
    height: {{map.height}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  controls {
    options: {{controls.options}}
  }
  legend {
    show: {{legend.show}}
  }
  performance {
    lazyLoading: {{performance.lazyLoading}}
  }
)
```

---

# Guardrails

- `map.standard` and `map.darkMode` must reference existing `mapBackground` shared components.
- Use `map.backgrounds.md` for API-key, WMS, raster, and vector background-specific guidance.
- Shared backgrounds are the correct path when the request needs custom hosted tiles or shared reuse across multiple regions.
