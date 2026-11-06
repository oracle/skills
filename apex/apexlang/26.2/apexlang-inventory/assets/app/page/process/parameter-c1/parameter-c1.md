# parameter

- componentType: `parameter`
- identifierRequired: false
- appliesWhen: `process[identification.type] = workflow`

## Properties

### identification (direct group)

- `name` — `<@parameter>`; —; Yes; —; —; lovType=COMPONENT; —;

### value

- `type` — `<STRING>`; —; Yes; `ITEM`; `<enum:[staticValue:"Static Value", item:"Item", sqlQuery:"SQL Query (return single value)", expression:"Expression", functionBody:"Function Body", preference:"Preference", default:"Default", null:"Null"]>`; —; —;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = staticValue` or `parameter[value.type] = staticValue`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = sqlQuery` or `parameter[value.type] = sqlQuery`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `parameter[value.type] = item` or `parameter[value.type] = item`;
- `trueValue` — `<STRING>`; —; No; —; —; maxLength=10; `parameter[value.type] = item` or `parameter[value.type] = preference` or `parameter[value.type] = item` or `parameter[value.type] = preference`;
- `falseValue` — `<STRING>`; —; No; —; —; maxLength=10; `parameter[value.type] = item` or `parameter[value.type] = preference` or `parameter[value.type] = item` or `parameter[value.type] = preference`;
- `formatMask` — `<STRING>`; Format mask to convert the Static or Item value to the data type of the workflow parameter.; No; —; —; maxLength=255; `parameter[value.type] = staticValue` or `parameter[value.type] = item` or `parameter[value.type] = staticValue` or `parameter[value.type] = item` or `parameter[value.type] = staticValue` or `parameter[value.type] = item` or `parameter[value.type] = staticValue` or `parameter[value.type] = item` or `parameter[value.type] = staticValue` or `parameter[value.type] = item` or `parameter[value.type] = staticValue` or `parameter[value.type] = item` or `parameter[value.type] = staticValue` or `parameter[value.type] = item` or `parameter[value.type] = staticValue` or `parameter[value.type] = item`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `parameter[value.type] = expression` or `parameter[value.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `parameter[value.type] = functionBody` or `parameter[value.type] = functionBody`;
- `staticValue` — `<STRING>`; —; Yes; —; `<enum:[true:"True", false:"False"]>`; —; `parameter[value.type] = staticValue` or `parameter[value.type] = staticValue`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = sql` or `parameter[value.type] = expression` and `parameter[value.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = plsql` or `parameter[value.type] = expression` and `parameter[value.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = javaScript-mle` or `parameter[value.type] = expression` and `parameter[value.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = functionBody` and `parameter[value.language] = plsql` or `parameter[value.type] = functionBody` and `parameter[value.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = functionBody` and `parameter[value.language] = javaScript-mle` or `parameter[value.type] = functionBody` and `parameter[value.language] = javaScript-mle`;

