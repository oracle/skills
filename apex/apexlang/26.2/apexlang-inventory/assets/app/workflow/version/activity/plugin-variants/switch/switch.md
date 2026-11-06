# plugin-variants/switch

- componentType: `activity`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a name for the workflow activity.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[switch:"Switch"]>`; —; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `label` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `diagram` — `<STRING>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### switch

- `type` — `<STRING>`; —; Yes; `TRUE_FALSE_CHECK`; `<enum:[trueFalseCheck:"True False Check", checkWorkflowVar:"Check Workflow Variable", if:"If Elsif Else", case:"Case"]>`; maxLength=4000; —;

### source

- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL"]>`; —; —;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `activity[source.location] = restEnabledSql`;
- `plsqlCode` — `<STRING>`; Enter the PL/SQL code to be executed on the remote database.; Yes; —; —; —; `activity[source.location] = restEnabledSql`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `activity[source.location] = localDatabase`;
- `plsqlCode` — `<STRING>`; —; Yes; —; —; —; `activity[source.location] = localDatabase` and `activity[source.language] = plsql`;
- `javaScriptCode` — `<STRING>`; —; Yes; —; —; —; `activity[source.location] = localDatabase` and `activity[source.language] = javaScript-mle`;

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
- `agent` — `<@aiAgent>`; —; No; —; —; lovType=COMPONENT; `activity[genAI.enabled] = Y`;
- `service` — `<@genAIService>`; —; No; —; —; lovType=COMPONENT; `activity[genAI.enabled] = Y`;
- `systemPrompt` — `<STRING>`; —; No; —; —; —; `activity[genAI.enabled] = Y`;

### condition

- `conditionType` — `<STRING>`; —; Yes; `ROWS_RETURNED`; `<enum:[functionBody:"Function Body", workflowVarEqualsValue:"Workflow Variable = Value", workflowVarIsNull:"Workflow Variable is NULL", rowsReturned:"Rows Returned", rowsNotReturned:"Rows Not Returned", expression:"Expression", workflowVarNotEqualsValue:"Workflow Variable != Value", workflowVarIsNotNull:"Workflow Variable is NOT NULL"]>`; maxLength=4000; `activity[switch.type] = trueFalseCheck`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = functionBody`;
- `workflowVar` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = workflowVarIsNull` or `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = workflowVarIsNotNull` or `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = workflowVarEqualsValue` or `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = workflowVarNotEqualsValue`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL&#x2F\;SQL", js-mle:"JAVASCRIPT (MLE)"]>`; —; `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = expression` or `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = functionBody`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = rowsReturned` or `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = rowsNotReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = workflowVarEqualsValue` or `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = workflowVarNotEqualsValue`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = trueFalseCheck` and `activity[condition.conditionType] = expression`;

### compare

- `compareVar` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `activity[switch.type] = checkWorkflowVar`;
- `dataType` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[boolean:"BOOLEAN", timestamp:"TIMESTAMP", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", varchar2:"VARCHAR2", number:"NUMBER"]>`; maxLength=4000; `activity[switch.type] = case`;
- `compareType` — `<STRING>`; —; Yes; `SQL_QUERY`; `<enum:[expression:"Expression", sqlQuery:"SQL Query", functionBody:"Function Body"]>`; maxLength=4000; `activity[switch.type] = case`;
- `comparePlsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = case` and `activity[compare.compareType] = expression`;
- `compareLanguage` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL&#x2F\;SQL", js-mle:"JAVASCRIPT (MLE)"]>`; —; `activity[switch.type] = case` and `activity[compare.compareType] = expression` or `activity[switch.type] = case` and `activity[compare.compareType] = functionBody`;
- `comparePlsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = case` and `activity[compare.compareType] = functionBody`;
- `compareSqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = case` and `activity[compare.compareType] = sqlQuery`;

