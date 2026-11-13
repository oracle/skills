# sort

- componentType: `sort`
- identifierRequired: false
- appliesWhen: `region[identification.type] = interactiveGrid`

## Properties

### sort

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `direction` — `<STRING>`; —; Yes; `ASC`; `<enum:[asc:"Ascending", desc:"Descending"]>`; —; —;
- `nulls` — `<STRING>`; —; Yes; —; `<enum:[first:"First", last:"Last"]>`; —; —;

### identification (direct group)

- `column` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; —;

