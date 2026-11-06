# tableLookup

- componentType: `tableLookup`
- identifierRequired: true
- appliesWhen: `legacyDataLoadDefinition[validation.skipValidation] = N`

## Properties

### lookup

- `returnColumn` — `<STRING>`; Select the name of the column returned by the table lookup. This value will be inserted into the load column specified, and is generally the key value of the parent in a foreign key relationship. For example: DEPTNO.; Yes; —; —; —; —;

### identification (direct group)

- `columnName` — `<STRING>`; —; Yes; —; —; —; —;

### compareUploadWith

- `column` — `<STRING>`; —; Yes; —; —; —; —;
- `column2` — `<STRING>`; —; No; —; —; —; —;
- `column3` — `<STRING>`; —; No; —; —; —; —;

### advanced

- `insertNewValue` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### error

- `errorMessage` — `<STRING>`; The error message will be displayed to end users when an error occurs with trying to retrieve the return column from the lookup table using the lookup column(s) provided.; No; —; —; maxLength=4000; —;

### source

- `tableOwner` — `<STRING>`; —; Yes; —; —; —; —;
- `tableName` — `<STRING>`; —; Yes; —; —; maxLength=128; —;
- `whereClause` — `<STRING>`; The where clause will be used as part of the SQL used to retrieve the Return Column from the lookup table.; No; —; —; maxLength=4000; —;

