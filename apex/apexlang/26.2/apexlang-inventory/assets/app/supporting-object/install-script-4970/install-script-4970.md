# installScript

- componentType: `installScript`
- identifierRequired: true
- filePath: `supporting-objects/install-scripts.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The name of this installation script.; Yes; —; —; maxLength=255; —;

### script

- `content` — `<STRING>`; —; Yes; —; —; —; —;
- `type` — `<STRING>`; —; No; —; `<enum:[packageSpec:"Package Spec", packageBody:"Package Body", table:"Table"]>`; —; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always:"Always", rowsReturned:"Rows returned", noRowsReturned:"No Rows returned", expression:"Expression", functionBody:"Function Body", never:"Never"]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `installScript[serverSideCondition.type] = rowsReturned` or `installScript[serverSideCondition.type] = noRowsReturned`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `installScript[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `installScript[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `installScript[serverSideCondition.type] = expression` and `installScript[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `installScript[serverSideCondition.type] = expression` and `installScript[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `installScript[serverSideCondition.type] = expression` and `installScript[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `installScript[serverSideCondition.type] = functionBody` and `installScript[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `installScript[serverSideCondition.type] = functionBody` and `installScript[serverSideCondition.language] = javaScript-mle`;

### execution

- `sequence` — `<NUMBER>`; The sequence number of this installation script. Scripts run in order of ascending sequence number.; Yes; —; —; —; —;

