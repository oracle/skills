# inParameter

- componentType: `inParameter`
- identifierRequired: false
- appliesWhen: `process[identification.type] = webService` or `process[identification.type] = legacyWebService`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `parameterId` — `<STRING>`; —; Yes; —; —; —; —;

### parameter

- `source` — `<STRING>`; —; Yes; —; `<enum:[item:"Item", staticValue:"Static Value", plsqlFunctionBody:"PL/SQL Function Body"]>`; —; —;
- `item` — `<STRING>`; —; Yes; —; —; textCase=UPPER; `inParameter[parameter.source] = item`;
- `staticValue` — `<STRING>`; —; No; —; —; —; `inParameter[parameter.source] = staticValue`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `inParameter[parameter.source] = plsqlFunctionBody`;

