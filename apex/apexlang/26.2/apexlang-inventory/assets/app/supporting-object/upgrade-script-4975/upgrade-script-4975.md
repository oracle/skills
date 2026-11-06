# upgradeScript

- componentType: `upgradeScript`
- identifierRequired: true
- filePath: `supporting-objects/upgrade-scripts.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The name of this installation script.; Yes; —; —; maxLength=255; —;

### script

- `content` — `<STRING>`; —; Yes; —; —; —; —;
- `type` — `<STRING>`; —; No; —; `<enum:[packageSpec:"Package Spec", packageBody:"Package Body", table:"Table"]>`; —; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always:"Always", rowsReturned:"Rows returned", noRowsReturned:"No Rows returned", expression:"Expression", functionBody:"Function Body", never:"Never"]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `upgradeScript[serverSideCondition.type] = rowsReturned` or `upgradeScript[serverSideCondition.type] = noRowsReturned`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `upgradeScript[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `upgradeScript[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `upgradeScript[serverSideCondition.type] = expression` and `upgradeScript[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `upgradeScript[serverSideCondition.type] = expression` and `upgradeScript[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `upgradeScript[serverSideCondition.type] = expression` and `upgradeScript[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `upgradeScript[serverSideCondition.type] = functionBody` and `upgradeScript[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `upgradeScript[serverSideCondition.type] = functionBody` and `upgradeScript[serverSideCondition.language] = javaScript-mle`;

### execution

- `sequence` — `<NUMBER>`; The sequence number of this installation script. Scripts run in order of ascending sequence number.; Yes; —; —; —; —;

