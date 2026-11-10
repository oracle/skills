# participant

- componentType: `participant`
- identifierRequired: false

## Properties

### identification (direct group)

- `type` — `<STRING>`; —; Yes; `POTENTIAL_OWNER`; `<enum:[potentialOwner:"Potential Owner", businessAdministrator:"Business Administrator", excludedOwner:"Excluded Owner", excludedAdmin:"Excluded Admin"]>`; —; —;
- `identityType` — `<STRING>`; —; Yes; `USER`; `<enum:[user:"User", authorizationScheme:"Authorization Scheme"]>`; —; —;

### value

- `type` — `<STRING>`; —; Yes; `STATIC`; `<enum:[staticValue:"Static Value", sqlQuery:"SQL Query", expression:"Expression", functionBody:"Function Body"]>`; —; —;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `participant[value.type] = staticValue`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `participant[value.type] = sqlQuery`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `participant[value.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `participant[value.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `participant[value.type] = expression` and `participant[value.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `participant[value.type] = expression` and `participant[value.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `participant[value.type] = expression` and `participant[value.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `participant[value.type] = functionBody` and `participant[value.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `participant[value.type] = functionBody` and `participant[value.language] = javaScript-mle`;

