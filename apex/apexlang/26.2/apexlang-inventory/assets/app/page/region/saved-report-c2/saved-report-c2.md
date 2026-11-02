# savedReport

- componentType: `savedReport`
- identifierRequired: true
- appliesWhen: `region[identification.type] = interactiveReport`

## Properties

### view

- `chart` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `groupBy` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `pivot` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `default` — `<STRING>`; —; Yes; `REPORT`; `<enum:[report:"Report", icon:"Icon", detail:"Detail", chart:"Chart", groupBy:"Group By", pivot:"Pivot"]>`; —; —;
- `rowsPerPage` — `<STRING>`; —; No; —; —; —; —;

### identification (direct group)

- `visibility` — `<STRING>`; —; Yes; —; `<enum:[primaryDefault:"Primary Default", alternativeDefault:"Alternative Default", public:"Public", private:"Private"]>`; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; —; —;
- `name` — `<STRING>`; Displays the name of the Saved Report.; Yes; —; —; maxLength=255; —;

### description

- `description` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### chart

- `type` — `<STRING>`; —; Yes; `bar`; `<enum:[bar:"Bar", lineWithArea:"Line with Area", pie:"Pie", line:"Line"]>`; —; `savedReport[view.chart] = Y`;
- `label` — `<STRING>`; —; Yes; —; —; maxLength=128; `savedReport[view.chart] = Y`;
- `value` — `<STRING>`; —; No; —; —; maxLength=128; `savedReport[view.chart] = Y`;
- `valueAggregation` — `<STRING>`; —; No; —; `<enum:[sum:"Sum", average:"Average", min:"Minimum", max:"Maximum", count:"Count"]>`; —; `savedReport[view.chart] = Y`;

### sort

- `by` — `<STRING>`; —; Yes; `DEFAULT`; `<enum:[default:"Default", valueAsc:"Value Ascending", valueDesc:"Value Descending", labelAsc:"Label Ascending", labelDesc:"Label Descending"]>`; —; `savedReport[view.chart] = Y`;

### settings

- `appUser` — `<STRING>`; —; Yes; —; —; maxLength=255; `savedReport[identification.visibility] = public`;

### axisTitle

- `label` — `<STRING>`; —; No; —; —; maxLength=255; `savedReport[view.chart] = Y` and `savedReport[view.chart] = Y`;
- `value` — `<STRING>`; —; No; —; —; maxLength=255; `savedReport[view.chart] = Y` and `savedReport[view.chart] = Y`;

### chartAppearance

- `orientation` — `<STRING>`; —; Yes; `vertical`; `<enum:[vertical:"Vertical", horizontal:"Horizontal"]>`; —; `savedReport[view.chart] = Y` and `savedReport[view.chart] = Y`;

### flashback

- `minutesAgo` — `<NUMBER>`; —; No; —; —; —; `attributes[searchBar.includeSearchBar] = Y` and `attributes[actionsMenu.includeActionsMenu] = Y` and `attributes[actionsMenu.flashback] = Y`;
- `enabled` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `attributes[searchBar.includeSearchBar] = Y` and `attributes[actionsMenu.includeActionsMenu] = Y` and `attributes[actionsMenu.flashback] = Y` and `savedReport[flashback.minutesAgo] = sample`;

