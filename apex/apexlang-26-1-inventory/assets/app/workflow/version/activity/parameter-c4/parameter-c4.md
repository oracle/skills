# parameter

- componentType: `parameter`
- identifierRequired: false
- appliesWhen: `activity[identification.type] = humanTaskCreate`

## Properties

### value

- `type` — `<STRING>`; —; Yes; `STATIC`; `<enum:[staticValue:"Static Value", item:"Item", sqlQuery:"SQL Query (return single value)", expression:"Expression", functionBody:"Function Body", preference:"Preference", null:"Null"]>`; —; —;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = staticValue`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = sqlQuery`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `parameter[value.type] = item`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `parameter[value.type] = preference`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `parameter[value.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `parameter[value.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = functionBody` and `parameter[value.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = functionBody` and `parameter[value.language] = javaScript-mle`;

### identification (direct group)

- `name` — `<@parameter>`; —; Yes; —; —; lovType=COMPONENT; —;

