# groupByAggregate

- componentType: `groupByAggregate`
- identifierRequired: false
- appliesWhen: `savedReport[view.groupBy] = Y` and `region[identification.type] = interactiveReport`

## Properties

### appearance

- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; —;

### layout

- `sequence` — `<INTEGER>`; —; Yes; —; —; —; —;

### aggregate

- `displaySum` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `function` — `<STRING>`; —; Yes; `SUM`; `<enum:[sum:"Sum", average:"Average", max:"Maximum", min:"Minimum", median:"Median", count:"Count", countDistinct:"Count Distinct", percentOfTotalSum:"Percent of Total Sum", percentOfTotalCount:"Percent of Total Count"]>`; —; —;
- `column` — `<STRING>`; —; No; —; —; maxLength=128; `groupByAggregate[aggregate.function] = count` or `groupByAggregate[aggregate.function] = countDistinct` or `groupByAggregate[aggregate.function] = percentOfTotalCount`;
- `column` — `<STRING>`; —; Yes; —; —; maxLength=128; —;

### heading (direct group)

- `heading` — `<STRING>`; —; No; —; —; maxLength=4000; —;

