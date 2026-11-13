# taskDefinition

- componentType: `taskDefinition`
- identifierRequired: true
- filePath: `shared-components/task-definitions/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Name of this task definition.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[approval:"Approval Task", action:"Action Task"]>`; —; —;

### task

- `subject` — `<STRING>`; —; Yes; —; —; maxLength=400; —;
- `priority` — `<STRING>`; —; Yes; `3`; `<enum:[1:"1-Urgent", 2:"2-High", 3:"3-Medium", 4:"4-Low", 5:"5-Lowest"]>`; —; —;
- `initiatorCanComplete` — `<BOOLEAN>`; —; Yes; `N`; —; —; `taskDefinition[identification.type] = approval`;
- `outcomes` — `<STRING>`; —; No; —; —; maxLength=4000; `taskDefinition[identification.type] = action`;

### advanced

- `detailsPage` — `<COMPLEX>`; —; No; —; —; —; —;
- `staticId` — `<STRING>`; Static ID for this task definition. The static ID is used when manually executing the automation with the APEX_APPROVAL package (APEX_HUMAN_TASK.CREATE_TASK).; Yes; —; —; maxLength=255; —;
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
- `sqlQuery` — `<STRING>`; A SQL Query returning the system of records Specify the SQL query that will be the source of the data evaluated during the execution of the task associated with this task definition, for example:  select empno, ename, job, sal from  emp  Column values can be used within task definition actions with bind variable syntax (for example, :EMPNO).; Yes; —; —; —; `taskDefinition[source.type] = sqlQuery`;

### columnMapping

- `primaryKeyColumn` — `<STRING>`; The primary key column for the table which will serve as the system of records for actions defined for this task definition.; No; —; —; —; `taskDefinition[source.type] = tableView`;

