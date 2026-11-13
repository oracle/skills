# savedReport

- componentType: `savedReport`
- identifierRequired: true
- appliesWhen: `region[identification.type] = interactiveGrid`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Displays the name of the Saved Report.; No; —; —; maxLength=255; —;
- `visibility` — `<STRING>`; —; Yes; —; `<enum:[primary:"Primary", alternative:"Alternative", public:"Public", private:"Private"]>`; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; —; —;

### view

- `chart` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `default` — `<STRING>`; —; Yes; —; `<enum:[icon:"Icon", grid:"Grid", detail:"Detail", chart:"Chart"]>`; —; —;
- `rowsPerPage` — `<STRING>`; —; No; —; —; —; —;
- `settingsAreaExpanded` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `stretchColumns` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### flashback

- `minutesAgo` — `<NUMBER>`; —; No; —; —; —; —;
- `enabled` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `savedReport[flashback.minutesAgo] = sample`;

### singleRowView

- `excludeNullValues` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `displayedColumns` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### chart

- `type` — `<STRING>`; —; Yes; —; `<enum:[area:"Area", bar:"Bar", bubble:"Bubble", donut:"Donut", funnel:"Funnel", line:"Line", lineWithArea:"Line with Area", pie:"Pie", polar:"Polar", radar:"Radar", range:"Range", scatter:"Scatter", stock:"Stock"]>`; —; `savedReport[view.chart] = Y`;
- `label` — `<@column>`; —; No; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y`;
- `value` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y`;
- `open` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y` and `chart[chart.type] = stock`;
- `close` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y` and `chart[chart.type] = stock`;
- `high` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y` and (`chart[chart.type] = range` or `chart[chart.type] = stock`);
- `low` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y` and (`chart[chart.type] = range` or `chart[chart.type] = stock`);
- `volume` — `<@column>`; —; No; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y` and `chart[chart.type] = stock`;
- `target` — `<@column>`; —; No; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y` and `chart[chart.type] = funnel`;
- `x` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y` and (`chart[chart.type] = bubble` or `chart[chart.type] = scatter`);
- `y` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y` and (`chart[chart.type] = bubble` or `chart[chart.type] = scatter`);
- `z` — `<@column>`; —; No; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y` and (`chart[chart.type] = bubble` or `chart[chart.type] = bar` or `chart[chart.type] = range`);
- `series` — `<@column>`; —; No; —; —; lovType=COMPONENT; `savedReport[view.chart] = Y` and (`chart[chart.type] = area` or `chart[chart.type] = bar` or `chart[chart.type] = line` or `chart[chart.type] = lineWithArea` or `chart[chart.type] = range` or `chart[chart.type] = scatter`);
- `valueAggregation` — `<STRING>`; —; No; —; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", approxCountDistinct:"Approx. Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; `savedReport[view.chart] = Y` and `chart[chart.value] = sample`;
- `openAggregation` — `<STRING>`; —; No; —; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", approxCountDistinct:"Approx. Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; `savedReport[view.chart] = Y` and `chart[chart.type] = stock` and `chart[chart.open] = sample`;
- `closeAggregation` — `<STRING>`; —; No; —; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", approxCountDistinct:"Approx. Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; `savedReport[view.chart] = Y` and `chart[chart.type] = stock` and `chart[chart.close] = sample`;
- `highAggregation` — `<STRING>`; —; No; —; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", approxCountDistinct:"Approx. Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; `savedReport[view.chart] = Y` and `chart[chart.high] = sample` and (`chart[chart.type] = range` or `chart[chart.type] = stock`);
- `lowAggregation` — `<STRING>`; —; No; —; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", approxCountDistinct:"Approx. Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; `savedReport[view.chart] = Y` and `chart[chart.low] = sample` and (`chart[chart.type] = range` or `chart[chart.type] = stock`);
- `volumeAggregation` — `<STRING>`; —; No; —; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", approxCountDistinct:"Approx. Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; `savedReport[view.chart] = Y` and `chart[chart.type] = stock` and `chart[chart.volume] = sample`;
- `targetAggregation` — `<STRING>`; —; No; —; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", approxCountDistinct:"Approx. Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; `savedReport[view.chart] = Y` and `chart[chart.type] = funnel` and `chart[chart.target] = sample`;
- `xAggregation` — `<STRING>`; —; No; —; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", approxCountDistinct:"Approx. Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; `savedReport[view.chart] = Y` and `chart[chart.x] = sample` and (`chart[chart.type] = bubble` or `chart[chart.type] = scatter`);
- `yAggregation` — `<STRING>`; —; No; —; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", approxCountDistinct:"Approx. Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; `savedReport[view.chart] = Y` and `chart[chart.y] = sample` and (`chart[chart.type] = bubble` or `chart[chart.type] = scatter`);
- `zAggregation` — `<STRING>`; —; No; —; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", approxCountDistinct:"Approx. Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; `savedReport[view.chart] = Y` and `chart[chart.z] = sample` and (`chart[chart.type] = bubble` or `chart[chart.type] = bar` or `chart[chart.type] = range`);
- `stacked` — `<BOOLEAN>`; —; Yes; `off`; —; —; `savedReport[view.chart] = Y` and `chart[chart.series] = sample` and (`chart[chart.type] = area` or `chart[chart.type] = bar` or `chart[chart.type] = line` or `chart[chart.type] = lineWithArea` or `chart[chart.type] = range` or `chart[chart.type] = scatter`);

### sort

- `direction` — `<STRING>`; —; Yes; `ASC`; `<enum:[asc:"Ascending", desc:"Descending"]>`; —; `savedReport[view.chart] = Y`;
- `nulls` — `<STRING>`; —; Yes; `FIRST`; `<enum:[first:"First", last:"Last"]>`; —; `savedReport[view.chart] = Y`;
- `by` — `<STRING>`; —; Yes; `LABEL`; `<enum:[label:"Label", value:"Value", high:"High", low:"Low", target:"Target", x:"X", y:"Y", z:"Z"]>`; —; `savedReport[view.chart] = Y`;

### axisTitle

- `label` — `<STRING>`; —; No; —; —; maxLength=255; `savedReport[view.chart] = Y` and (`chart[chart.type] = area` or `chart[chart.type] = bar` or `chart[chart.type] = bubble` or `chart[chart.type] = line` or `chart[chart.type] = lineWithArea` or `chart[chart.type] = range` or `chart[chart.type] = scatter`);
- `value` — `<STRING>`; —; No; —; —; maxLength=255; `savedReport[view.chart] = Y` and (`chart[chart.type] = area` or `chart[chart.type] = bar` or `chart[chart.type] = bubble` or `chart[chart.type] = line` or `chart[chart.type] = lineWithArea` or `chart[chart.type] = range` or `chart[chart.type] = scatter`);
- `decimalPlaces` — `<INTEGER>`; —; No; —; —; —; `savedReport[view.chart] = Y` and (`chart[chart.type] = area` or `chart[chart.type] = bar` or `chart[chart.type] = bubble` or `chart[chart.type] = donut` or `chart[chart.type] = line` or `chart[chart.type] = lineWithArea` or `chart[chart.type] = pie` or `chart[chart.type] = range` or `chart[chart.type] = scatter`);

### chartAppearance

- `orientation` — `<STRING>`; —; Yes; `vertical`; `<enum:[vertical:"Vertical", horizontal:"Horizontal"]>`; —; `savedReport[view.chart] = Y` and (`chart[chart.type] = area` or `chart[chart.type] = bar` or `chart[chart.type] = funnel` or `chart[chart.type] = line` or `chart[chart.type] = lineWithArea` or `chart[chart.type] = range`);

