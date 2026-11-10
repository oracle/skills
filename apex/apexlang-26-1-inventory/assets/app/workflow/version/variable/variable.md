# variable

- componentType: `variable`
- identifierRequired: true

## Properties

### identification (direct group)

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; —;

### value

- `type` — `<STRING>`; —; Yes; `NULL`; `<enum:[staticValue:"Static Value", item:"Item", sqlQuery:"SQL Query (return single value)", expression:"Expression", functionBody:"Function Body", null:"Null"]>`; —; —;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `variable[value.type] = staticValue`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `variable[value.type] = sqlQuery`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `variable[value.type] = item`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `variable[value.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `variable[value.type] = functionBody`;
- `staticValue` — `<STRING>`; —; Yes; —; `<enum:[true:"True", false:"False"]>`; —; `variable[value.type] = staticValue` and `variable[parameter.dataType] = boolean`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `variable[value.type] = expression` and `variable[value.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `variable[value.type] = expression` and `variable[value.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `variable[value.type] = expression` and `variable[value.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `variable[value.type] = functionBody` and `variable[value.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `variable[value.type] = functionBody` and `variable[value.language] = javaScript-mle`;

### parameter

- `dataType` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[varchar2:"VARCHAR2", timestamp:"TIMESTAMP", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", number:"NUMBER", boolean:"BOOLEAN", clob:"CLOB"]>`; maxLength=128; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### label

- `label` — `<STRING>`; An end-user friendly name of the workflow variable.; Yes; —; —; maxLength=4000; —;

### displayFormatMasks

- `sessionStateFormatMask` — `<STRING>`; Format mask to be used to convert the workflow variable into a NUMBER or TIMESTAMP and back into a VARCHAR2 when the parameter is used in a bind variable or substitution string.; No; —; —; maxLength=255; `variable[parameter.dataType] = number` or `variable[parameter.dataType] = timestamp` or `variable[parameter.dataType] = timestampWithTimeZone` or `variable[parameter.dataType] = timestampWithLocalTimeZone`;
- `trueValue` — `<STRING>`; —; No; —; —; maxLength=10; `variable[parameter.dataType] = boolean`;
- `falseValue` — `<STRING>`; —; No; —; —; maxLength=10; `variable[parameter.dataType] = boolean`;

