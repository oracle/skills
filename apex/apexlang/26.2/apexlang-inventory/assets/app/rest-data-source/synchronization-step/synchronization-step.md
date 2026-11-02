# synchronizationStep

- componentType: `synchronizationStep`
- identifierRequired: true
- appliesWhen: `restDataSource[synchronization.localTableName] = sample`

## Properties

### identification (direct group)

- `staticId` — `<STRING>`; Enter a static ID to uniquely identify a synchronization step.; Yes; —; —; maxLength=255; —;

### execution

- `active` — `<BOOLEAN>`; Whether this step will be executed or not.; Yes; `Y`; —; —; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### externalFilter

- `filter` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

