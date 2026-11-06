# parameter

- componentType: `parameter`
- identifierRequired: true

## Properties

### validation

- `required` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### identification (direct group)

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `dataType` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[string:"String"]>`; —; —;
- `label` — `<STRING>`; An end-user friendly name of the task parameter.; Yes; —; —; maxLength=255; —;

### advanced

- `showOnTaskDetails` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `updatable` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

