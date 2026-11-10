# sort

- componentType: `sort`
- identifierRequired: false
- appliesWhen: `region[identification.type] = interactiveReport`

## Properties

### sort

- `sequence` — `<INTEGER>`; —; Yes; —; —; —; —;
- `direction` — `<STRING>`; —; Yes; `ASC`; `<enum:[asc:"Ascending", desc:"Descending"]>`; —; —;
- `nulls` — `<STRING>`; —; No; —; `<enum:[first:"First", last:"Last"]>`; —; —;

### identification (direct group)

- `column` — `<STRING>`; —; Yes; —; —; maxLength=128; —;

