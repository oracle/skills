# aggregate

- componentType: `aggregate`
- identifierRequired: true
- appliesWhen: `region[identification.type] = interactiveGrid`

## Properties

### aggregate (direct group)

- `function` — `<STRING>`; —; Yes; `SUM`; `<enum:[sum:"Sum", average:"Average", count:"Count", countDistinct:"Count Distinct", min:"Minimum", max:"Maximum", median:"Median"]>`; —; —;
- `column` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; —;
- `tooltip` — `<STRING>`; —; No; —; —; —; —;
- `showGrandTotal` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### advanced

- `enabled` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

