## Chart Page Standards

### Purpose
- Ensure chart-focused pages follow a consistent layout and use the approved chart configuration patterns.

### Rules (Non-Negotiable)
1. Set `pageTemplate: @/standard` with `templateOptions: #DEFAULT#`.
2. For each chart region, use `type: chart`, `appearance.template: @/standard`, and series definitions that reference the chart guidance.
3. Every `series` block inside a chart region MUST define `execution { sequence: <positive integer> }`; the sequence must be explicit and unique within that chart region.
4. Cartesian charts (`line`, `bar`, `area`, `scatter`, `bubble`, `stock`, `range`, `pareto`) MUST declare axis children for at least `x` and `y`. Treat this as a required structural child contract, not as optional visual formatting.
5. Each chart `axis` child MUST use the canonical APEXlang form: `axis <unique-static-id> ( name: x|y|y2 ... )`; do not emit anonymous axis blocks.
6. Dual-axis charts MUST declare a separate `axis ... ( name: y2 )` whenever any series is assigned to the secondary Y axis.
7. Submit controlling filter items via `pageItemsToSubmit` whenever charts depend on page items or smart filters.
8. Apply navigation/breadcrumb requirements from `apex.page.md`.
9. Chart `columnMapping` names MUST match the SQL output aliases exactly, including case; generated chart SQL should use uppercase or explicit semantic aliases referenced verbatim by `columnMapping`.

### Guidance
- Mirror `templates/page-examples/dashboard-page/dashboard-page._index.md` or chart-specific templates in `region-components/` for series structure, format masks, and legends.
- Combine charts with cards or other regions using the dashboard or report guardrails as appropriate.
- When defining chart types, set `chart { type: <chart-type> }` where `<chart-type>` is one of `bar`, `line`, `area`, `pie`, `donut`, `scatter`, `bubble`, `range`, `pareto`, or `stock`.
- Pie and donut charts do not require cartesian axes; omit `axis` blocks unless a specific supported configuration requires them.
- Do not treat cartesian chart axes as optional just because titles are obvious or because the chart is small. The required `axis x` and `axis y` blocks are part of the legal emitted shape.
- When a chart depends on page items, LOV filters, or dynamic actions, list those items in `pageItemsToSubmit`; missing entries must be flagged in critique.
- For SQL-backed chart series, alias projected columns explicitly and reference those aliases verbatim in `columnMapping`. Prefer uppercase aliases such as `LABEL`, `VALUE`, `STORE_LABEL`, and `TOTAL_VALUE`.
- Axis format settings must use supported APEX enums (dateShort/dateMedium/dateLong/dateFull, timeShort/timeMedium/timeLong/timeFull, datetimeShort/datetimeMedium/datetimeLong/datetimeFull, decimal, currency, percent). Omit the `format` attribute for textual axes; never output `format: text`.
- Axis tick blocks must use the canonical plural names `majorTicks` and `minorTicks`; do not emit stale singular aliases such as `majorTick` or `minorTick`.
- For charts with dual axes or mixed series (for example, bar + line, or Y2 assignments), document the axis intent through comments or region-level advanced attributes so reviewers understand the configuration.
- JavaScript customizations (`componentAdvanced.initJavaScriptFunction`, `dataCursor`, or legend overrides) must include a short inline comment describing the learning outcome being demonstrated, following the documentation template rule in `00-guard/ai.guard.md`.
- Prefer declarative options for stacking, label display, and tooltip content before falling back to JavaScript; align with the chart region template upgrades.

### Declarative Checklist
- `pageItemsToSubmit`: include every item used in SQL predicates, dynamic axis calculations, or init JS snippets. For interactive documentation pages, comment which permutation the item supports.
- `chartLayout.height` and optional `maxWidth`: size charts to fit surrounding content; avoid hard-coding width via CSS.
- `legend` and `dataCursor`: enable these declaratively when explaining interactivity. Document why the chosen behavior matters.
- `tooltip` and `label` blocks: showcase percentage, currency, or conditional formatting by referencing the allowed enums and masks.
- `componentAdvanced.initJavaScriptFunction`: limit to scenarios where declarative options are insufficient; annotate behavior for readers (for example `/* docs: sync y-axis to items */`).
- `advanced.regionDisplaySelector`: enable when the page demonstrates multiple chart variants sharing the same slot; disable if unnecessary.
- Each chart `series`: set `execution.sequence` explicitly even for a single series; never rely on inferred ordering.
- Each cartesian chart: emit axis blocks explicitly even if the intended axis titles are short or obvious.

### Sample Page References
- `p00002-area.apx`: Demonstrates custom legend icons via JavaScript and stacked area series. Highlights use of comments explaining the legend override.
- `p00008-scatter.apx`: Shows dynamic Y-axis min/max driven by select lists; ensure both items are listed in `pageItemsToSubmit` and referenced in inline documentation comments.
- `p00009-bar.apx`: Covers dual-axis configuration with data labels; annotate why the Y2 axis is used.
- `p00024-dashboard-pies.apx`: Illustrates multiple charts sharing a page with region display selectors and collapsible explanatory regions.

- Chart series may include security { authorizationScheme: ... } referencing `{your-app-alias}/shared-components/authorizations.apx` when visibility must be restricted; otherwise omit the block.
