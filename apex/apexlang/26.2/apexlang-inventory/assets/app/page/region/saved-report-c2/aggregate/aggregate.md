# aggregate

- componentType: `aggregate`
- identifierRequired: false
- appliesWhen: `region[identification.type] = interactiveReport`

## Properties

### aggregate (direct group)

- `function` — `<STRING>`; —; Yes; `SUM`; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; —;
- `column` — `<STRING>`; —; Yes; —; —; maxLength=128; `aggregate[aggregate.function] = count` or `aggregate[aggregate.function] = countDistinct`;

