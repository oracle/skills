---
templateId: region.chart._common
componentType: region
version: 1.0
description: Shared guardrails and variable contract for Oracle APEX chart regions.
---

# Purpose

Define canonical chart-region contract, required inputs, and guardrails for all chart scenario templates.

---

# Rules & Guardrails

1. Load `chart._index.md`, `chart._common.md`, `chart._series._common.md`, and `chart._axis._common.md` before drafting chart scenarios.
2. Load `references/policies/memory-bank/30-pages/apex.chart-page.md`, `20-data/apex.sql.md`, and `40-components/apex.templates.md` for page/data/template guardrails.
3. Use the dedicated `region-chart` template variant.
4. Treat the chart qualifier as mandatory design intent: `bar`, `line`, `pie`, `donut`, or `area`.
5. Use variable-driven placeholders in executable output templates; keep static demonstrations in `config/` and `features/` references.
6. Keep SQL deterministic with explicit aliases; avoid `SELECT *`.
7. Cartesian charts must render x and y axis blocks; render y2 only when needed.
8. Axis metadata must use the canonical chart-axis contract, including plural tick blocks (`majorTicks`, `minorTicks`) and supported value-format enums only.
9. Keep label and value mappings on the series block.
10. Default chart regions to `appearance.template: @/standard` unless a documented chart scenario explicitly needs a different structural shell.
11. Treat the qualifier file as the authoritative chart-type selector. Do not browse the folder to rediscover shared series/axis filenames; the canonical shared files are `chart._series._common.md` and `chart._axis._common.md`.
12. If compiler-backed prop lookup is uncertain because the exact internal chart subtype token is unknown, stop guessing and draft from the checked-in chart contracts instead of bouncing between query attempts.
13. For compiler-backed chart child lookup, use the dotted aliases `chart.series` and `chart.axis` first. Do not query those child contracts with `--parent region`; in this runtime the compiler resolves them under chart `attributes`.

---

# Variable Contract

## Required Variables

- `chartRegion.staticId`
- `chartRegion.name`
- `layout.sequence`
- `layout.slot`
- `chart.type`
- `seriesBlocks` (from `chart._series._common.md`)

## Optional Variables

- `appearance.*`
- `advanced.*`
- `chart.options`
- `chartAppearance`
- `chartLayout`
- `legend`
- `axisBlocks` (from `chart._axis._common.md`)
- `scenarioExtensions`

---

# Output Template – Skeleton

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

- Pick exactly one chart qualifier file per region.
- Render `{{seriesBlocks}}` using `chart._series._common.md`.
- Render `{{axisBlocks}}` using `chart._axis._common.md` when axis-capable chart types are used.
- For bar, line, area, scatter, stock, and other cartesian chart types, the shared axis file is mandatory.
- For pie, donut, and other non-axis chart types, omit axis blocks unless the chosen qualifier explicitly requires them.
- Chart regions may also include standard region-title blocks when the scenario needs a visible heading.
- Keep axis configuration only when the selected chart type uses axes.
- Omit optional blocks not required by the selected chart type.
- Keep `appearance.template: @/standard` as the default shell for chart regions.

---

# Guardrails

- Metadata export lookup: search for `Chart`, the qualifier name, and the series label/value mapping properties.
- Preferred query helpers for chart children:
  - `node tools/query-valid-props.mjs --component chart.series`
  - `node tools/query-valid-props.mjs --component chart.axis`
  - `node tools/query-valid-props.mjs --component chart.series --group columnMapping`
- Avoid `node ... --component series --parent region ...` for charts; that path is not how this runtime exposes chart child contracts.
