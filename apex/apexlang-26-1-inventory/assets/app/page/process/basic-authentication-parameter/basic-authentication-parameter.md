# basicAuthenticationParameter

- componentType: `basicAuthenticationParameter`
- identifierRequired: false
- appliesWhen: `process[identification.type] = webService` or `process[identification.type] = legacyWebService`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `parameterId` — `<STRING>`; —; Yes; —; —; —; —;

### parameter

- `source` — `<STRING>`; —; Yes; —; `<enum:[item:"Item", staticValue:"Static Value", plsqlFunctionBody:"PL/SQL Function Body"]>`; —; —;
- `item` — `<STRING>`; —; Yes; —; —; textCase=UPPER; `basicAuthenticationParameter[parameter.source] = item`;
- `staticValue` — `<STRING>`; —; No; —; —; —; `basicAuthenticationParameter[parameter.source] = staticValue`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `basicAuthenticationParameter[parameter.source] = plsqlFunctionBody`;

