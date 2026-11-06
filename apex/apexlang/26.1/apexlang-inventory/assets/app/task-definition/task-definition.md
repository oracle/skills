# taskDefinition

- componentType: `taskDefinition`
- identifierRequired: true
- filePath: `shared-components/task-definitions/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[approval:"Approval Task", action:"Action Task"]>`; —; —;

### task

- `subject` — `<STRING>`; —; Yes; —; —; maxLength=400; —;
- `priority` — `<STRING>`; —; Yes; `3`; `<enum:[1:"1-Urgent", 2:"2-High", 3:"3-Medium", 4:"4-Low", 5:"5-Lowest"]>`; —; —;
- `initiatorCanComplete` — `<BOOLEAN>`; —; Yes; `N`; —; —; `taskDefinition[identification.type] = approval`;

### advanced

- `detailsPage` — `<COMPLEX>`; —; No; —; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `vacationRuleProcedureName` — `<STRING>`; —; No; —; —; maxLength=500; —;

### deadline

- `dueOnType` — `<STRING>`; —; No; —; `<enum:[interval:"Interval", sqlQuery:"SQL Query", expression:"Expression", functionBody:"Function Body", schedulerExpression:"Scheduler Expression"]>`; —; —;
- `interval` — `<STRING>`; —; Yes; —; —; maxLength=255; `taskDefinition[deadline.dueOnType] = interval`;
- `schedulerExpression` — `<STRING>`; —; Yes; —; —; maxLength=255; `taskDefinition[deadline.dueOnType] = schedulerExpression`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `taskDefinition[deadline.dueOnType] = sqlQuery`;
- `expirationPolicy` — `<STRING>`; —; Yes; `NONE`; `<enum:[none:"None", expire:"Expire", renew:"Renew"]>`; —; `taskDefinition[deadline.dueOnType] = sample`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `taskDefinition[deadline.dueOnType] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `taskDefinition[deadline.dueOnType] = functionBody`;
- `maxRenewalCount` — `<NUMBER>`; —; Yes; —; —; —; `taskDefinition[deadline.dueOnType] = sample` and `taskDefinition[deadline.expirationPolicy] = renew`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `taskDefinition[deadline.dueOnType] = expression` and `taskDefinition[deadline.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `taskDefinition[deadline.dueOnType] = expression` and `taskDefinition[deadline.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `taskDefinition[deadline.dueOnType] = expression` and `taskDefinition[deadline.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `taskDefinition[deadline.dueOnType] = functionBody` and `taskDefinition[deadline.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `taskDefinition[deadline.dueOnType] = functionBody` and `taskDefinition[deadline.language] = javaScript-mle`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### source

- `type` — `<STRING>`; —; Yes; `NONE`; `<enum:[none:"None", tableView:"Table / View", sqlQuery:"SQL Query"]>`; —; —;
- `tableOwner` — `<STRING>`; —; No; —; —; —; `taskDefinition[source.type] = tableView`;
- `tableName` — `<STRING>`; —; Yes; —; —; maxLength=128; `taskDefinition[source.type] = tableView`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; —; `taskDefinition[source.type] = sqlQuery`;

### columnMapping

- `primaryKeyColumn` — `<STRING>`; —; No; —; —; —; `taskDefinition[source.type] = tableView`;

