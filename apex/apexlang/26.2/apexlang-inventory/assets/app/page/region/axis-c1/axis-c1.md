# axis

- componentType: `axis`
- identifierRequired: true
- appliesWhen: `attributes[chart.type] = area` and `region[identification.type] = chart` or `attributes[chart.type] = bar` and `region[identification.type] = chart` or `attributes[chart.type] = boxPlot` and `region[identification.type] = chart` or `attributes[chart.type] = bubble` and `region[identification.type] = chart` or `attributes[chart.type] = combination` and `region[identification.type] = chart` or `attributes[chart.type] = gantt` and `region[identification.type] = chart` or `attributes[chart.type] = line` and `region[identification.type] = chart` or `attributes[chart.type] = lineWithArea` and `region[identification.type] = chart` or `attributes[chart.type] = polar` and `region[identification.type] = chart` or `attributes[chart.type] = radar` and `region[identification.type] = chart` or `attributes[chart.type] = range` and `region[identification.type] = chart` or `attributes[chart.type] = scatter` and `region[identification.type] = chart` or `attributes[chart.type] = stock` and `region[identification.type] = chart`

## Properties

### identification (direct group)

- `title` — `<STRING>`; Enter a title for the axis. This title describes the information being represented on the axis of your chart.; No; —; —; maxLength=255; —;
- `name` — `<STRING>`; —; Yes; —; `<enum:[x:"x", y:"y", y2:"y2", major:"major", minor:"minor"]>`; —; —;
- `showAxis` — `<BOOLEAN>`; —; Yes; `on`; —; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2` or `axis[identification.name] = major`;

### advanced

- `staticId` — `<STRING>`; Enter a unique Static ID for the chart axis. The Static ID can be useful when developing custom JavaScript behavior for the chart axis or to refer it in application export files. Be cautious when changing it after creation.; No; —; —; maxLength=255; —;

### value

- `format` — `<STRING>`; —; No; —; `<enum:[dateShort:"Date - Short", dateMedium:"Date - Medium", dateLong:"Date - Long", dateFull:"Date - Full", timeShort:"Time - Short", timeMedium:"Time - Medium", timeLong:"Time - Long", timeFull:"Time - Full", datetimeShort:"DateTime - Short", datetimeMedium:"DateTime - Medium", datetimeLong:"DateTime - Long", datetimeFull:"DateTime - Full", decimal:"Decimal", currency:"Currency", percent:"Percent"]>`; —; —;
- `decimalPlaces` — `<INTEGER>`; —; No; —; —; —; `axis[value.format] = decimal` and `axis[identification.name] = x` or `axis[value.format] = decimal` and `axis[identification.name] = y` or `axis[value.format] = decimal` and `axis[identification.name] = y2` or `axis[value.format] = currency` and `axis[identification.name] = x` or `axis[value.format] = currency` and `axis[identification.name] = y` or `axis[value.format] = currency` and `axis[identification.name] = y2` or `axis[value.format] = percent` and `axis[identification.name] = x` or `axis[value.format] = percent` and `axis[identification.name] = y` or `axis[value.format] = percent` and `axis[identification.name] = y2`;
- `currency` — `<STRING>`; —; No; —; —; maxLength=128; `axis[value.format] = currency` and `axis[identification.name] = x` or `axis[value.format] = currency` and `axis[identification.name] = y` or `axis[value.format] = currency` and `axis[identification.name] = y2`;
- `pattern` — `<STRING>`; —; No; —; —; maxLength=30; `axis[value.format] = sample` and `axis[identification.name] = x` or `axis[value.format] = sample` and `axis[identification.name] = y` or `axis[value.format] = sample` and `axis[identification.name] = y2` or `axis[value.format] = sample` and `axis[identification.name] = major` or `axis[value.format] = sample` and `axis[identification.name] = minor`;
- `formatScaling` — `<STRING>`; —; Yes; `auto`; `<enum:[none:"None", auto:"Automatic", thousand:"Thousand", million:"Million", billion:"Billion", trillion:"Trillion", quadrillion:"Quadrillion"]>`; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;
- `min` — `<NUMBER>`; —; No; —; —; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;
- `max` — `<NUMBER>`; —; No; —; —; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;
- `baselineScaling` — `<STRING>`; —; Yes; `zero`; `<enum:[min:"Minimum", zero:"Zero"]>`; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;
- `step` — `<NUMBER>`; —; No; —; —; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;
- `scale` — `<STRING>`; —; Yes; `linear`; `<enum:[linear:"Linear", log:"Log"]>`; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;

### title

- `fontFamily` — `<STRING>`; —; No; —; `<enum:[arial:"Arial", arialBlack:"Arial Black", bookman:"Bookman", comicSansMs:"Comic Sans MS", courier:"Courier", courierNew:"Courier New", garamond:"Garamond", georgia:"Georgia", helvetica:"Helvetica", impact:"Impact", palatino:"Palatino", times:"Times", timesNewRoman:"Times New Roman", trebuchetMs:"Trebuchet MS", verdana:"Verdana"]>`; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;
- `fontStyle` — `<STRING>`; —; No; —; `<enum:[normal:"Normal", italic:"Italic", oblique:"Oblique"]>`; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;
- `fontSize` — `<STRING>`; —; No; —; `<enum:[8:"8", 10:"10", 12:"12", 14:"14", 16:"16", 18:"18", 20:"20", 22:"22"]>`; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;
- `fontColor` — `<STRING>`; —; No; —; —; maxLength=255; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;

### appearance

- `position` — `<STRING>`; —; Yes; `auto`; `<enum:[auto:"Automatic", start:"Start", end:"End", top:"Top", bottom:"Bottom"]>`; —; —;

### majorTicks

- `show` — `<STRING>`; —; Yes; `on`; `<enum:[auto:"Automatic", true:"Yes", false:"No"]>`; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;
- `minStep` — `<NUMBER>`; —; No; —; —; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;

### minorTicks

- `show` — `<STRING>`; —; Yes; `auto`; `<enum:[auto:"Automatic", true:"Yes", false:"No"]>`; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;
- `step` — `<NUMBER>`; —; No; —; —; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;

### tickLabel

- `show` — `<BOOLEAN>`; —; Yes; `on`; —; —; `axis[identification.name] = x` or `axis[identification.name] = y` or `axis[identification.name] = y2`;
- `fontFamily` — `<STRING>`; —; No; —; `<enum:[arial:"Arial", arialBlack:"Arial Black", bookman:"Bookman", comicSansMs:"Comic Sans MS", courier:"Courier", courierNew:"Courier New", garamond:"Garamond", georgia:"Georgia", helvetica:"Helvetica", impact:"Impact", palatino:"Palatino", times:"Times", timesNewRoman:"Times New Roman", trebuchetMs:"Trebuchet MS", verdana:"Verdana"]>`; —; `axis[identification.name] = x` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = x` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = x` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on`;
- `fontStyle` — `<STRING>`; —; No; —; `<enum:[normal:"Normal", italic:"Italic", oblique:"Oblique"]>`; —; `axis[identification.name] = x` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = x` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = x` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on`;
- `fontSize` — `<STRING>`; —; No; —; `<enum:[8:"8", 10:"10", 12:"12", 14:"14", 16:"16", 18:"18", 20:"20", 22:"22"]>`; —; `axis[identification.name] = x` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = x` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = x` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on`;
- `fontColor` — `<STRING>`; —; No; —; —; maxLength=255; `axis[identification.name] = x` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = x` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = x` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = y` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = x` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = y` and `axis[tickLabel.show] = on` or `axis[identification.name] = y2` and `axis[identification.name] = y2` and `axis[tickLabel.show] = on`;
- `rotation` — `<BOOLEAN>`; —; Yes; `auto`; —; —; `axis[identification.name] = x` and `axis[tickLabel.show] = on` and `axis[identification.name] = x` or `axis[identification.name] = y` and `axis[tickLabel.show] = on` and `axis[identification.name] = x` or `axis[identification.name] = y2` and `axis[tickLabel.show] = on` and `axis[identification.name] = x`;
- `position` — `<STRING>`; —; Yes; `outside`; `<enum:[outside:"Outside", inside:"Inside"]>`; —; `axis[identification.name] = x` and `axis[tickLabel.show] = on` and `axis[identification.name] = x` or `axis[identification.name] = y` and `axis[tickLabel.show] = on` and `axis[identification.name] = x` or `axis[identification.name] = y2` and `axis[tickLabel.show] = on` and `axis[identification.name] = x`;

### dualYAxes

- `show` — `<STRING>`; —; Yes; `auto`; `<enum:[auto:"Automatic", true:"Yes", false:"No"]>`; —; `axis[identification.name] = y2`;
- `splitterPosition` — `<NUMBER>`; —; No; —; —; —; `axis[identification.name] = y2`;

### timeScale

- `scale` — `<STRING>`; —; Yes; —; `<enum:[seconds:"Seconds", minutes:"Minutes", hours:"Hours", days:"Days", weeks:"Weeks", months:"Months", quarters:"Quarters", years:"Years"]>`; —; `axis[identification.name] = major` or `axis[identification.name] = minor`;

### zoomScale

- `seconds` — `<BOOLEAN>`; —; Yes; `N`; —; —; `axis[identification.name] = major` or `axis[identification.name] = minor`;
- `minutes` — `<BOOLEAN>`; —; Yes; `N`; —; —; `axis[identification.name] = major` or `axis[identification.name] = minor`;
- `hours` — `<BOOLEAN>`; —; Yes; `N`; —; —; `axis[identification.name] = major` or `axis[identification.name] = minor`;
- `days` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `axis[identification.name] = major` or `axis[identification.name] = minor`;
- `weeks` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `axis[identification.name] = major` or `axis[identification.name] = minor`;
- `months` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `axis[identification.name] = major` or `axis[identification.name] = minor`;
- `quarters` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `axis[identification.name] = major` or `axis[identification.name] = minor`;
- `years` — `<BOOLEAN>`; —; Yes; `N`; —; —; `axis[identification.name] = major` or `axis[identification.name] = minor`;

