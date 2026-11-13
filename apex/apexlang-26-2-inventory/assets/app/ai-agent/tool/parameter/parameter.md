# parameter

- componentType: `parameter`
- identifierRequired: true
- appliesWhen: `tool[identification.executionPoint] = onDemand`

## Properties

### validation

- `required` — `<BOOLEAN>`; Specify whether a value for this parameter must always be provided by the AI Service.; Yes; `Y`; —; —; —;
- `allowedValues` — `<STRING>`; —; No; —; —; maxLength=4000; `parameter[value.dataType] = varchar2` or `parameter[value.dataType] = number`;

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=30, textCase=UPPER; —;
- `description` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### value

- `dataType` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[varchar2:"VARCHAR2", clob:"CLOB", number:"NUMBER", boolean:"BOOLEAN"]>`; —; —;

