# synchronizationStep

- componentType: `synchronizationStep`
- identifierRequired: true
- appliesWhen: `restDataSource[synchronization.localTableName] = sample`

## Properties

### identification (direct group)

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### execution

- `active` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### externalFilter

- `filter` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

