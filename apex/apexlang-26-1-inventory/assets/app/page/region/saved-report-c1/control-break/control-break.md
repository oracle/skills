# controlBreak

- componentType: `controlBreak`
- identifierRequired: false
- appliesWhen: `region[identification.type] = interactiveGrid`

## Properties

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### sort

- `direction` — `<STRING>`; —; Yes; `ASC`; `<enum:[asc:"Ascending", desc:"Descending"]>`; —; —;
- `nulls` — `<STRING>`; —; No; —; `<enum:[first:"First", last:"Last"]>`; —; —;

### identification (direct group)

- `column` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; —;

### advanced

- `enabled` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

