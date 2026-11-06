# parameter

- componentType: `parameter`
- identifierRequired: false
- appliesWhen: `series[source.location] = restSource` and `series[source.restSource] = sample` and `series[source.location] = restSource` and `series[restSynchronization.useLocalTable] = N` and `region[identification.type] = chart` or `series[source.location] = restSource` and `series[source.restSource] = sample` and `series[source.location] = restSource` and `series[source.location] = restSource` and `series[restSynchronization.useLocalTable] = N` and `region[identification.type] = chart` or `series[source.location] = restSource` and `series[source.restSource] = sample` and `series[source.location] = restSource` and `series[restSynchronization.useLocalTable] = N` and `region[identification.type] = chart`

## Properties

### identification (direct group)

- `name` — `<@parameter>`; —; Yes; —; —; lovType=COMPONENT; —;

### value

- `type` — `<STRING>`; —; Yes; —; `<enum:[staticValue:"Static Value", restSourceDefault:"REST Source Default", item:"Item", sqlQuery:"SQL Query (return single value)", expression:"Expression", functionBody:"Function Body", collectionClob:"Collection (CLOB)", preference:"Preference", parentColumn:"Parent Column", null:"Null"]>`; —; —;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = staticValue`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = sqlQuery`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `parameter[value.type] = item`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `parameter[value.type] = preference`;
- `name` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `parameter[value.type] = collectionClob`;
- `trueValue` — `<STRING>`; —; No; —; —; maxLength=10; `parameter[value.type] = item` or `parameter[value.type] = preference`;
- `falseValue` — `<STRING>`; —; No; —; —; maxLength=10; `parameter[value.type] = item` or `parameter[value.type] = preference`;
- `formatMask` — `<STRING>`; Format mask to convert the Static, Item or Preference value to the data type of the REST Source Parameter.; No; —; —; maxLength=255; `parameter[value.type] = staticValue` or `parameter[value.type] = item` or `parameter[value.type] = preference` or `parameter[value.type] = staticValue` or `parameter[value.type] = item` or `parameter[value.type] = preference` or `parameter[value.type] = staticValue` or `parameter[value.type] = item` or `parameter[value.type] = preference` or `parameter[value.type] = staticValue` or `parameter[value.type] = item` or `parameter[value.type] = preference`;
- `column` — `<@column>`; —; Yes; —; —; lovType=COMPONENT; `parameter[value.type] = parentColumn`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `parameter[value.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `parameter[value.type] = functionBody`;
- `staticValue` — `<STRING>`; —; Yes; —; `<enum:[true:"True", false:"False"]>`; —; `parameter[value.type] = staticValue`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = expression` and `parameter[value.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = functionBody` and `parameter[value.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `parameter[value.type] = functionBody` and `parameter[value.language] = javaScript-mle`;

### parameter

- `ignoreOutput` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

