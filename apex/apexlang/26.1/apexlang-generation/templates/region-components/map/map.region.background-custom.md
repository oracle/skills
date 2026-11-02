---
templateId: region.map.background-custom
componentType: region
version: 1.0
imports:
  - map._common.md
description: Map region scenario using built-in custom standard and dark backgrounds.
---

# Purpose

Document the region-level background path where `tileLayerType` uses the built-in background map names seeded by APEX.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `layout.sequence`
- `layout.slot`
- `map.background` (use `builtIn`)
- `map.standard`

## Optional Variables

- `map.darkMode`
- `map.height`
- `controls.navigationBar`
- `controls.navigationBarPosition`
- `controls.options`
- `legend.show`
- `legend.position`
- `performance.lazyLoading`

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: map
  map {
    background: builtIn
    standard: {{map.standard}}
    darkMode: {{map.darkMode}}
    height: {{map.height}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  controls {
    navigationBar: {{controls.navigationBar}}
    navigationBarPosition: {{controls.navigationBarPosition}}
    options: {{controls.options}}
  }
  legend {
    show: {{legend.show}}
    position: {{legend.position}}
  }
  performance {
    lazyLoading: {{performance.lazyLoading}}
  }
)
```

---

# Guardrails

- `map.background: builtIn` selects built-in standard and dark-mode background names, not shared `mapBackground` components.
- The app/plugin attribute `useVectorTileLayers` still separately controls whether supported built-in backgrounds use vector tile layers behind the scenes.
- Load `map.backgrounds.md` only when the request uses shared backgrounds instead of built-in background names.
