# pivotAggregate

- componentType: `pivotAggregate`
- identifierRequired: true
- appliesWhen: `savedReport[view.pivot] = Y` and `region[identification.type] = interactiveReport`

## Properties

### appearance

- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; —;

### aggregate

- `function` — `<STRING>`; —; Yes; —; `<enum:[sum:"Sum", average:"Average", max:"Maximum", min:"Minimum", median:"Median", count:"Count", countDistinct:"Count Distinct", ratioToReportSum:"Ratio To Report Sum", ratioToReportCount:"Ratio To Report Count"]>`; —; —;
- `displaySum` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `column` — `<STRING>`; —; No; —; —; maxLength=128; `pivotAggregate[aggregate.function] = count` or `pivotAggregate[aggregate.function] = countDistinct` or `pivotAggregate[aggregate.function] = ratioToReportCount`;
- `column` — `<STRING>`; —; Yes; —; —; maxLength=128; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### heading (direct group)

- `heading` — `<STRING>`; Identifies the aggregate column label; No; —; —; maxLength=4000; —;

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

