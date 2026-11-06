# validation

- componentType: `validation`
- identifierRequired: true
- filePath: `supporting-objects/validations.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter the name for the validation. This name should be descriptive so that developers can easily identify conditions being checked.; Yes; —; —; maxLength=255; —;

### validation

- `type` — `<STRING>`; —; No; —; `<enum:[always:"Always", rowsReturned:"Rows returned", noRowsReturned:"No Rows returned", expression:"Expression", functionBody:"Function Body", never:"Never"]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = rowsReturned` or `validation[validation.type] = noRowsReturned`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `validation[validation.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `validation[validation.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = expression` and `validation[validation.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = expression` and `validation[validation.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = expression` and `validation[validation.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = functionBody` and `validation[validation.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = functionBody` and `validation[validation.language] = javaScript-mle`;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always:"Always", rowsReturned:"Rows returned", noRowsReturned:"No Rows returned", expression:"Expression", functionBody:"Function Body", never:"Never"]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = rowsReturned` or `validation[serverSideCondition.type] = noRowsReturned`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `validation[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `validation[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = expression` and `validation[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = expression` and `validation[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = expression` and `validation[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = functionBody` and `validation[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = functionBody` and `validation[serverSideCondition.language] = javaScript-mle`;

### error

- `errorMessage` — `<STRING>`; Enter a message to be displayed when the conditions of this validation are not met.; Yes; —; —; maxLength=4000; —;

### execution

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

