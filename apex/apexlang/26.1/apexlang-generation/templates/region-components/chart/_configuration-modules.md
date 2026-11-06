## Chart Config Modules

Reusable add-ons that complement base chart variants. Each module documents a focused capability (legend customization, dual axis, data label formatting, etc.).

| Module Name | Focus | Notes |
|-------------|-------|-------|
| legend-image-icons | Legend icons via static files | Replaces legend entries with images sourced from static application files. |
| region-display-selector | Toggle chart variants | Ensures target regions set `advanced.regionDisplaySelector: true`. |
| sql-driven-colors | Color columns in SQL | Alias color values and map through `columnMapping.color`. |
| legend-resize-buttons | Legend size adjustments | Uses dynamic actions to adjust legend size at runtime. |
| donut-other-threshold | Donut threshold control | Documents how to alter `otherThreshold` via dynamic actions. |
| date-range-filters | Date pickers for viewport | Covers item configuration and `pageItemsToSubmit`. |
| no-data-translation | No-data messaging | Wraps translation override patterns. |
| axis-formatting | Axis format enums | Reference for `value.format`, decimal places, min/max. |
| axis-range-controls | Axis min/max items | Steps for item creation and `minimum/maximum` configuration. |
| page-items-to-submit | Refresh dependencies | Checklist for submitting items used in predicates or JS. |
| dual-axis | Y/Y2 configuration | Details `dualYAxes` block and series assignment. |
| data-label-formatting | Label positioning | Patterns for `label.position`, font, color, percentage formatting. |
| line-style-variants | Line/marker styles | Catalog of `line.type` and `marker.shape` combinations. |
| stacked-percent-axis | Percent stacking | Axis min/max and format requirements for percent views. |
| tooltip-formatting | Tooltip overrides | Declarative vs JS tooltip customization. |
| dashboard-layout | Dashboard composition | Guidance for combining charts with supporting regions. |
| zoom-scroll | Zoom & scroll behaviors | Explains `zoomAndScroll`, overview usage, and interactions. |
| chart-links | Chart link patterns | Summarizes redirect URL, link columns, and action integration. |

Add modules under `config/` as markdown files and reference them from scenario templates as needed.
