---
templateId: region.chart.area-custom-legend
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
  - chart._axis._common.md
description: Area chart scenario with custom-legend extension hooks.
---

# Purpose

Variable-driven area chart scenario with optional custom legend behavior.

---

# Generation Rules (MANDATORY)

1. Load `chart._common.md`, `chart._series._common.md`, and `chart._axis._common.md` before use.
2. Keep legend scripts and static-file references variable-driven.
3. Keep executable output contract-only; move fixed demonstrations to config/features references.

---

# Output Template – Full

```apexlang
region {{chartRegion.staticId}} (
  name: {{chartRegion.name}}
  type: chart
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: {{appearance.templateOptions}}
  }
  advanced {
    htmlDomId: {{advanced.htmlDomId}}
    regionDisplaySelector: {{advanced.regionDisplaySelector}}
  }
  chart {
    type: {{chart.type}}
    {{chart.options}}
  }
  chartAppearance {
    {{chartAppearance}}
  }
  chartLayout {
    {{chartLayout}}
  }
  componentAdvanced {
    initJavaScriptFunction:
      ```javascript-browser
      {{componentAdvanced.initJavaScriptFunction}}
      ```
  }
  legend {
    {{legend}}
  }

  {{seriesBlocks}}

  {{axisBlocks}}

  {{scenarioExtensions}}
)
```

---

# Conditional Rendering Rules

- Render `{{seriesBlocks}}` using `chart._series._common.md`.
- Render `{{axisBlocks}}` using `chart._axis._common.md`.
- Omit `componentAdvanced` when custom legend JavaScript is not required.
