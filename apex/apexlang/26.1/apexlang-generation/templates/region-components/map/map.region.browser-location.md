---
templateId: region.map.browser-location
componentType: region
version: 1.0
imports:
  - map._common.md
description: Map region scenario using browser-location-assisted initial positioning in the attached map structure.
---

# Purpose

Document browser-location-assisted initial positioning and the associated session behavior.

---

# Variable Contract

## Required Variables

- `regionStaticId`
- `name`
- `layout.sequence`
- `layout.slot`
- `controls.options` (must include `browserLocation`)
- `initialPositionAndZoom.type`
- `initialPositionAndZoom.getPositionFromBrowser`

## Optional Variables

- `map.height`

---

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: map
  map {
    height: {{map.height}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  controls {
    options: {{controls.options}}
  }
  initialPositionAndZoom {
    type: {{initialPositionAndZoom.type}}
    getPositionFromBrowser: {{initialPositionAndZoom.getPositionFromBrowser}}
  }
)
```

---

# Guardrails

- `initialPositionAndZoom.getPositionFromBrowser` is available only when `controls.options` includes browser location support.
- Browser-derived initial positioning applies only to the first page load in the APEX session; the widget then remembers position across page requests in the same session.
