# tableLookup

- componentType: `tableLookup`
- identifierRequired: true
- appliesWhen: `legacyDataLoadDefinition[validation.skipValidation] = N`

## Properties

### lookup

- `returnColumn` — `<STRING>`; —; Yes; —; —; —; —;

### identification (direct group)

- `columnName` — `<STRING>`; —; Yes; —; —; —; —;

### compareUploadWith

- `column` — `<STRING>`; —; Yes; —; —; —; —;
- `column2` — `<STRING>`; —; No; —; —; —; —;
- `column3` — `<STRING>`; —; No; —; —; —; —;

### advanced

- `insertNewValue` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### error

- `errorMessage` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### source

- `tableOwner` — `<STRING>`; —; No; —; —; —; —;
- `tableName` — `<STRING>`; —; Yes; —; —; maxLength=128; —;
- `whereClause` — `<STRING>`; —; No; —; —; maxLength=4000; —;

