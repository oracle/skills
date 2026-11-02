# Chart Templates

## Purpose
Canonical guidance for the `chart` region family, including shared contract loading and supported scenario variants.

## Usage
- Load `chart._index.md` first.
- Load `chart._common.md` next to align variable contracts, guardrails, and required inputs.
- Load `chart._series._common.md` for canonical series blocks.
- Load `chart._axis._common.md` for canonical axis blocks.
- Load one scenario variant matching the requested chart interaction pattern.
- Load `config/` and `features/` modules only when scenario-specific behavior requires them.
- For compiler-backed prop lookup, start with:
  - `--component chart.series`
  - `--component chart.axis`
  - `--component chart.series --group columnMapping`
- Do not query chart series or chart axis with `--parent region`; in this runtime the compiler resolves both under chart `attributes`, so `--component series --parent region` is the wrong path.

## Canonical Shared Files
- `chart._common.md` is the shared chart-region shell.
- `chart._series._common.md` is the shared series contract.
- `chart._axis._common.md` is the shared axis contract.

Agents should not need to list the chart directory to discover the shared series or axis filenames; use the three files above directly.

## Scenario Routing

Choose one chart-type qualifier file:

| Intent | File |
|---|---|
| area | `chart.area.md` |
| area with custom legend | `chart.area-custom-legend.md` |
| bar | `chart.bar.md` |
| bubble | `chart.bubble.md` |
| dashboard combination | `chart.dashboard-combination.md` |
| donut | `chart.donut.md` |
| gantt | `chart.gantt.md` |
| line | `chart.line.md` |
| line with area | `chart.line-with-area.md` |
| pie | `chart.pie.md` |
| scatter | `chart.scatter.md` |
| status meter gauge | `chart.status-meter-gauge.md` |
| stock | `chart.stock.md` |

## Practical Defaults

- Monthly trend or monthly spend chart:
  - `chart.line.md` for trend emphasis
  - `chart.bar.md` for period-over-period comparison
  - `chart.area.md` for filled trend emphasis
- Cartesian charts require the shared axis contract.
- Pie and donut charts use the shared series contract but suppress axis work.
- Use `features/` and `config/` only after the base qualifier is selected.

## Template Catalog
- `chart._index.md`
- `chart._common.md`
- `chart._series._common.md`
- `chart._axis._common.md`
- `_configuration-modules.md`
- `chart.area-custom-legend.md`
- `chart.area.md`
- `chart.bar.md`
- `chart.bubble.md`
- `chart.dashboard-combination.md`
- `chart.gantt.md`
- `chart.line-with-area.md`
- `chart.line.md`
- `chart.pie.md`
- `chart.scatter.md`
- `chart.status-meter-gauge.md`
- `chart.stock.md`
- `config/`
- `features/`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.
