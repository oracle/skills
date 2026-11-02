---
templateId: region.chart.index
componentType: region
version: 1.0
imports:
  - chart._common.md
  - chart._series._common.md
  - chart._axis._common.md
description: Routing entrypoint for chart region templates.
---

# Purpose

Primary routing entrypoint for `chart` region templates.

# Load Order

1. Load this file.
2. Load `chart._common.md`.
3. Load `chart._series._common.md`.
4. Load `chart._axis._common.md`.
5. Load exactly one chart-type qualifier file from this folder.
6. Load optional `config/` and `features/` modules only when needed.

# Shared Files

- Shared chart-region contract: `chart._common.md`
- Shared series contract: `chart._series._common.md`
- Shared axis contract: `chart._axis._common.md`

Do not browse the directory to rediscover the shared contract filenames. These three files are the canonical shared entrypoints for all chart work.

# Chart-Type Routing

Use exactly one qualifier file per chart region:

| Intent | Qualifier file |
|---|---|
| area chart | `chart.area.md` |
| area chart with custom legend | `chart.area-custom-legend.md` |
| bar chart | `chart.bar.md` |
| bubble chart | `chart.bubble.md` |
| dashboard combination chart | `chart.dashboard-combination.md` |
| donut chart | `chart.donut.md` |
| gantt chart | `chart.gantt.md` |
| line chart | `chart.line.md` |
| line chart with area fill | `chart.line-with-area.md` |
| pie chart | `chart.pie.md` |
| scatter chart | `chart.scatter.md` |
| status meter gauge | `chart.status-meter-gauge.md` |
| stock chart | `chart.stock.md` |

# Query Guidance

- Use the dotted chart aliases first:
  - `--component chart.series`
  - `--component chart.axis`
  - `--component chart.series --group columnMapping`
- Do not query chart series or chart axis with `--parent region`. In the compiler metadata for this runtime, `series` and `axis` resolve under chart `attributes`, not as direct `region` children, so `--component series --parent region` returns no matches.
- Use compiler-backed prop lookup when the exact chart subtype token is already known.
- If chart-specific compiler lookup is uncertain, do not bounce between guesses. Load the shared chart contracts above plus the matching qualifier file from the routing table and draft from the checked-in chart templates.
- For monthly trend or monthly spend visuals, start with `chart.line.md`, `chart.bar.md`, or `chart.area.md` based on the requested visual form, then add only the needed `features/` or `config/` modules.
