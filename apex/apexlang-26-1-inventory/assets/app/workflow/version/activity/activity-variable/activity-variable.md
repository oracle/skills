# activityVariable

- componentType: `activityVariable`
- identifierRequired: true

## Properties

### identification (direct group)

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; —;

### value

- `type` — `<STRING>`; —; Yes; `NULL`; `<enum:[staticValue:"Static Value", item:"Item", sqlQuery:"SQL Query (return single value)", expression:"Expression", functionBody:"Function Body", null:"Null"]>`; —; —;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activityVariable[value.type] = staticValue`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activityVariable[value.type] = sqlQuery`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `activityVariable[value.type] = item`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `activityVariable[value.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `activityVariable[value.type] = functionBody`;
- `staticValue` — `<STRING>`; —; Yes; —; `<enum:[true:"True", false:"False"]>`; —; `activityVariable[value.type] = staticValue` and `activityVariable[parameter.dataType] = boolean`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activityVariable[value.type] = expression` and `activityVariable[value.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activityVariable[value.type] = expression` and `activityVariable[value.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activityVariable[value.type] = expression` and `activityVariable[value.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activityVariable[value.type] = functionBody` and `activityVariable[value.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activityVariable[value.type] = functionBody` and `activityVariable[value.language] = javaScript-mle`;

### parameter

- `dataType` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[varchar2:"VARCHAR2", timestamp:"TIMESTAMP", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", number:"NUMBER", boolean:"BOOLEAN", clob:"CLOB"]>`; maxLength=128; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### label

- `label` — `<STRING>`; An end-user friendly name of the workflow variable.; Yes; —; —; maxLength=4000; —;

### displayFormatMasks

- `sessionStateFormatMask` — `<STRING>`; Format mask to be used to convert the workflow variable into a NUMBER or TIMESTAMP and back into a VARCHAR2 when the parameter is used in a bind variable or substitution string.; No; —; —; maxLength=255; `activityVariable[parameter.dataType] = number` or `activityVariable[parameter.dataType] = timestamp` or `activityVariable[parameter.dataType] = timestampWithTimeZone` or `activityVariable[parameter.dataType] = timestampWithLocalTimeZone`;
- `trueValue` — `<STRING>`; —; No; —; —; maxLength=10; `activityVariable[parameter.dataType] = boolean`;
- `falseValue` — `<STRING>`; —; No; —; —; maxLength=10; `activityVariable[parameter.dataType] = boolean`;

