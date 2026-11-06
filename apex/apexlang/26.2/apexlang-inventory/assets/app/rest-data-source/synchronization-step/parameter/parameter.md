# parameter

- componentType: `parameter`
- identifierRequired: false
- appliesWhen: `restDataSource[synchronization.localTableName] = sample`

## Properties

### identification (direct group)

- `name` — `<@parameter>`; —; Yes; —; —; lovType=COMPONENT; —;

### value

- `type` — `<STRING>`; —; Yes; —; `<enum:[staticValue:"Static Value", restSourceDefault:"REST Source Default", sqlQuery:"SQL Query (return single value)", expression:"Expression", functionBody:"Function Body", null:"Null"]>`; —; —;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = staticValue`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = sqlQuery`;
- `formatMask` — `<STRING>`; Format mask to convert the Static, Item or Preference value to the data type of the REST Source Parameter.; No; —; —; maxLength=255; `parameter[value.type] = staticValue` or `parameter[value.type] = staticValue` or `parameter[value.type] = staticValue` or `parameter[value.type] = staticValue`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `parameter[value.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `parameter[value.type] = functionBody`;
- `staticValue` — `<STRING>`; —; Yes; —; `<enum:[true:"True", false:"False"]>`; —; `parameter[value.type] = staticValue`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = functionBody` and `parameter[value.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = functionBody` and `parameter[value.language] = javaScript-mle`;

