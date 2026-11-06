# computation

- componentType: `computation`
- identifierRequired: true
- appliesWhen: `region[identification.type] = interactiveReport`

## Properties

### identification (direct group)

- `identifier` — `<STRING>`; —; Yes; —; —; maxLength=3; —;
- `columnName` — `<STRING>`; —; Yes; —; —; maxLength=128; —;

### source

- `expression` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `dataType` — `<STRING>`; —; Yes; —; `<enum:[varchar2:"Varchar2", date:"Date", number:"Number", clob:"Clob", boolean:"Boolean", other:"Other"]>`; —; —;

### label

- `column` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

### appearance

- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; `computation[source.dataType] = date` or `computation[source.dataType] = number`;

