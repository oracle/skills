# activity

- componentType: `activity`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a name for the workflow activity.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[draftGeneric:"Draft Generic", draftGeneric:"Draft Generic", draftSwitch:"Draft Switch", draftSwitch:"Draft Switch", draftWait:"Draft Wait", draftWait:"Draft Wait", executeCode:"Execute Code", executeCode:"Execute Code", generateTextWithAi:"Generate Text With AI", generateTextWithAi:"Generate Text With AI", humanTaskCreate:"Human Task - Create", humanTaskCreate:"Human Task - Create", invokeApi:"Invoke API", invokeApi:"Invoke API", invokeWorkflow:"Invoke Workflow", invokeWorkflow:"Invoke Workflow", parallelFlow:"Parallel Flow", parallelFlow:"Parallel Flow", sendEMail:"Send E-Mail", sendEMail:"Send E-Mail", sendPushNotification:"Send Push Notification", sendPushNotification:"Send Push Notification", serverSideGeocoding:"Server Side Geocoding", serverSideGeocoding:"Server Side Geocoding", switch:"Switch", switch:"Switch", wait:"Wait", wait:"Wait", workflowEnd:"Workflow End", workflowEnd:"Workflow End", workflowStart:"Workflow Start", workflowStart:"Workflow Start"]>`; —; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `label` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `diagram` — `<STRING>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### source

- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL"]>`; —; `activity[identification.type] = executeCode`;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `activity[identification.type] = executeCode` and `activity[source.location] = restEnabledSql`;
- `plsqlCode` — `<STRING>`; Enter the PL/SQL code to be executed on the remote database.; Yes; —; —; —; `activity[identification.type] = executeCode` and `activity[source.location] = restEnabledSql`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `activity[identification.type] = executeCode` and `activity[source.location] = localDatabase`;
- `plsqlCode` — `<STRING>`; —; Yes; —; —; —; `activity[identification.type] = executeCode` and `activity[source.location] = localDatabase` and `activity[source.language] = plsql`;
- `javaScriptCode` — `<STRING>`; —; Yes; —; —; —; `activity[identification.type] = executeCode` and `activity[source.location] = localDatabase` and `activity[source.language] = javaScript-mle`;

### deadline

- `dueOnType` — `<STRING>`; —; No; —; `<enum:[interval:"Interval", sqlQuery:"SQL Query", expression:"Expression", functionBody:"Function Body", schedulerExpression:"Scheduler Expression"]>`; —; —;
- `interval` — `<STRING>`; —; Yes; —; —; maxLength=255; `activity[deadline.dueOnType] = interval`;
- `schedulerExpression` — `<STRING>`; —; Yes; —; —; maxLength=255; `activity[deadline.dueOnType] = schedulerExpression`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = sqlQuery`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `activity[deadline.dueOnType] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `activity[deadline.dueOnType] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = expression` and `activity[deadline.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = expression` and `activity[deadline.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = expression` and `activity[deadline.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = functionBody` and `activity[deadline.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = functionBody` and `activity[deadline.language] = javaScript-mle`;

### additionalData

- `sqlQuery` — `<STRING>`; Enter a SQL query to read additional data.                 The column names of the query can be used as bind variables and substitution                 strings to evaluate conditions or activity variables during the execution of the activity.                 The result of the query should contain only one row.                  If the query returns no result or more than one row then the activity fails during execution.; No; —; —; maxLength=4000; —;

### parallelFlow

- `branch` — `<@branch>`; —; No; —; —; lovType=COMPONENT; —;

### genAI

- `enabled` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `agent` — `<@aiAgent>`; —; No; —; —; lovType=COMPONENT; `activity[genAI.enabled] = Y` or `activity[genAI.enabled] = Y`;
- `service` — `<@genAIService>`; —; No; —; —; lovType=COMPONENT; `activity[genAI.enabled] = Y` or `activity[genAI.enabled] = Y`;
- `systemPrompt` — `<STRING>`; —; No; —; —; —; `activity[genAI.enabled] = Y` or `activity[genAI.enabled] = Y`;

