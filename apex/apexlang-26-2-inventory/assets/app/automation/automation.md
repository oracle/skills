# automation

- componentType: `automation`
- identifierRequired: true
- filePath: `shared-components/automations/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Name of this automation.; Yes; —; —; maxLength=255; —;

### additionalCodeExecution

- `plsqlCode` — `<STRING>`; Enter a PL/SQL anonymous block of code that contains procedures to be called for Initialization or Cleanup of the automation, or before action processing for each row.  For performance reasons you can also store this code in a PL/SQL package in the database.; No; —; —; —; —;
- `initProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `beforeRowProcessingProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `cleanupProcedureName` — `<STRING>`; —; No; —; —; maxLength=255; —;

### execution

- `type` — `<STRING>`; —; Yes; `POLLING`; `<enum:[onDemand:"On Demand", scheduled:"Scheduled"]>`; —; —;
- `actionsInitiatedOn` — `<STRING>`; —; Yes; `ROWS`; `<enum:[rowsReturned:"Rows returned", noRowsReturned:"No Rows returned", functionBodyReturningBoolean:"Function Body Returning Boolean", always:"Always"]>`; —; —;
- `scheduleExpression` — `<STRING>`; —; Yes; —; —; maxLength=255; `automation[execution.type] = scheduled`;
- `scheduleStatus` — `<STRING>`; —; Yes; `DISABLED`; `<enum:[active:"Active", disabled:"Disabled", error:"Disabled (Error)"]>`; —; `automation[execution.type] = scheduled`;

### actionExecution

- `actionErrorHandling` — `<STRING>`; —; Yes; `IGNORE`; `<enum:[ignore:"Ignore", terminate:"Terminate Automation", disable:"Disable Automation"]>`; —; —;
- `commit` — `<STRING>`; —; Yes; `N`; `<enum:[once:"Once", eachRow:"Each Row"]>`; —; `automation[execution.actionsInitiatedOn] = rowsReturned`;
- `maxRowsToProcess` — `<INTEGER>`; —; No; —; —; —; `automation[execution.actionsInitiatedOn] = rowsReturned`;

### advanced

- `staticId` — `<STRING>`; Static ID for this automation. The static ID is used when manually executing the automation with the APEX_AUTOMATION package (APEX_AUTOMATION.EXECUTE).; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[rowsReturned:"Rows returned", noRowsReturned:"No Rows returned", expression:"Expression", functionBody:"Function Body", never:"Never"]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `automation[serverSideCondition.type] = rowsReturned` or `automation[serverSideCondition.type] = noRowsReturned`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `automation[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `automation[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `automation[serverSideCondition.type] = expression` and `automation[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `automation[serverSideCondition.type] = expression` and `automation[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `automation[serverSideCondition.type] = expression` and `automation[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `automation[serverSideCondition.type] = functionBody` and `automation[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `automation[serverSideCondition.type] = functionBody` and `automation[serverSideCondition.language] = javaScript-mle`;

### source

- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL"]>`; —; `automation[execution.actionsInitiatedOn] = functionBodyReturningBoolean`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `automation[execution.actionsInitiatedOn] = functionBodyReturningBoolean` or (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and `automation[source.type] = functionBody` and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`);
- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL", restSource:"REST Source", jsonDualityView:"JSON Duality View", jsonSource:"JSON Source", sampleData:"Sample Data"]>`; —; `automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`;
- `sampleData` — `<STRING>`; —; Yes; —; `<enum:[employees:"Employees", tasks:"Tasks", products:"Products", projects:"Projects"]>`; —; `automation[source.location] = sampleData` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`);
- `jsonDualityView` — `<@jsonDualityView>`; —; Yes; —; —; lovType=COMPONENT; `automation[source.location] = jsonDualityView` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`);
- `jsonSource` — `<@jsonSource>`; —; Yes; —; —; lovType=COMPONENT; `automation[source.location] = jsonSource` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`);
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `automation[source.language] = plsql` and (`automation[execution.actionsInitiatedOn] = functionBodyReturningBoolean` or (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and `automation[source.type] = functionBody` and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`));
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `automation[source.language] = javaScript-mle` and (`automation[execution.actionsInitiatedOn] = functionBodyReturningBoolean` or (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and `automation[source.type] = functionBody` and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`));
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `automation[source.location] = restEnabledSql` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned` or `automation[execution.actionsInitiatedOn] = functionBodyReturningBoolean`);
- `type` — `<STRING>`; —; Yes; `TABLE`; `<enum:[tableView:"Table / View", sqlQuery:"SQL Query", functionBody:"Function Body returning SQL Query", propertyGraph:"Property Graph"]>`; —; (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`);
- `restSource` — `<@restDataSource>`; —; Yes; —; —; lovType=COMPONENT; `automation[source.location] = restSource` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`);
- `optimizerHint` — `<STRING>`; —; No; —; —; maxLength=255; (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql` or `automation[source.location] = restSource` or `automation[source.location] = jsonDualityView` or `automation[source.location] = jsonSource`);
- `orderByClause` — `<STRING>`; —; No; —; —; maxLength=255; (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`) and (`automation[source.type] = tableView` or `automation[source.type] = propertyGraph`);
- `graphOwner` — `<STRING>`; —; No; —; —; —; `automation[source.type] = propertyGraph` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`);
- `graphName` — `<STRING>`; —; Yes; —; —; —; `automation[source.type] = propertyGraph` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`);
- `matchClause` — `<STRING>`; —; Yes; —; —; maxLength=4000; `automation[source.type] = propertyGraph` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`);
- `whereClause` — `<STRING>`; —; No; —; —; maxLength=4000; (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`) and (`automation[source.type] = propertyGraph` or `automation[source.type] = tableView`);
- `columnsClause` — `<STRING>`; —; Yes; —; —; maxLength=4000; `automation[source.type] = propertyGraph` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`);
- `tableOwner` — `<STRING>`; —; No; —; —; —; `automation[source.type] = tableView` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`);
- `tableName` — `<STRING>`; —; Yes; —; —; maxLength=128; `automation[source.type] = tableView` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`);
- `sqlQuery` — `<STRING>`; —; Yes; —; —; —; `automation[source.type] = sqlQuery` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = localDatabase` or `automation[source.location] = restEnabledSql`);
- `includeRowidColumn` — `<BOOLEAN>`; —; Yes; `N`; —; —; `automation[source.location] = restEnabledSql` and `automation[source.type] = tableView` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`);

### columnMapping

- `primaryKeyColumn` — `<STRING>`; Specify the primary key column within the query result. The value of this column will be added to the log messages, in order to allow correlating log messages to source rows.; No; —; —; —; `automation[execution.actionsInitiatedOn] = rowsReturned`;

### localPostProcessing

- `type` — `<STRING>`; —; No; —; `<enum:[whereOrderByClause:"Where/Order By Clause", sqlQuery:"SQL Query", plsqlFunctionBody:"PL/SQL Function Body returning SQL Query"]>`; —; (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = restSource` and `automation[source.restSource] = sample` or `automation[source.location] = jsonDualityView` and `automation[source.jsonDualityView] = sample` or `automation[source.location] = jsonSource` and `automation[source.jsonSource] = sample`);
- `whereClause` — `<STRING>`; —; No; —; —; maxLength=4000; `automation[localPostProcessing.type] = whereOrderByClause` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = restSource` and `automation[source.restSource] = sample` or `automation[source.location] = jsonDualityView` and `automation[source.jsonDualityView] = sample` or `automation[source.location] = jsonSource` and `automation[source.jsonSource] = sample`);
- `orderByClause` — `<STRING>`; —; No; —; —; maxLength=255; `automation[localPostProcessing.type] = whereOrderByClause` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = restSource` and `automation[source.restSource] = sample` or `automation[source.location] = jsonDualityView` and `automation[source.jsonDualityView] = sample` or `automation[source.location] = jsonSource` and `automation[source.jsonSource] = sample`);
- `sqlQuery` — `<STRING>`; —; Yes; —; —; —; `automation[localPostProcessing.type] = sqlQuery` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = restSource` and `automation[source.restSource] = sample` or `automation[source.location] = jsonDualityView` and `automation[source.jsonDualityView] = sample` or `automation[source.location] = jsonSource` and `automation[source.jsonSource] = sample`);
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `automation[localPostProcessing.type] = plsqlFunctionBody` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = jsonDualityView` and `automation[source.jsonDualityView] = sample` or `automation[source.location] = jsonSource` and `automation[source.jsonSource] = sample` or `automation[source.location] = restSource` and `automation[source.restSource] = sample`);
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `automation[localPostProcessing.type] = plsqlFunctionBody` and `automation[localPostProcessing.language] = plsql` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = jsonDualityView` and `automation[source.jsonDualityView] = sample` or `automation[source.location] = jsonSource` and `automation[source.jsonSource] = sample` or `automation[source.location] = restSource` and `automation[source.restSource] = sample`);
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `automation[localPostProcessing.type] = plsqlFunctionBody` and `automation[localPostProcessing.language] = javaScript-mle` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = jsonDualityView` and `automation[source.jsonDualityView] = sample` or `automation[source.location] = jsonSource` and `automation[source.jsonSource] = sample` or `automation[source.location] = restSource` and `automation[source.restSource] = sample`);

### dataProfile

- `nestedRows` — `<@dataProfileColumn>`; —; No; —; —; lovType=COMPONENT; (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[source.location] = jsonDualityView` or `automation[source.location] = jsonSource` or `automation[source.location] = restSource`);

### restSynchronization

- `useLocalTable` — `<BOOLEAN>`; —; Yes; `N`; —; —; `automation[source.location] = restSource` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`);

### externalFilterAndOrderBy

- `enabled` — `<BOOLEAN>`; —; Yes; `N`; —; —; `automation[source.location] = restSource` and `automation[source.restSource] = sample` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[restSynchronization.useLocalTable] = N` or `automation[restSynchronization.useLocalTable] = $NULL$`);
- `filter` — `<STRING>`; —; No; —; —; maxLength=4000; `automation[source.location] = restSource` and `automation[source.restSource] = sample` and `automation[externalFilterAndOrderBy.enabled] = Y` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[restSynchronization.useLocalTable] = N` or `automation[restSynchronization.useLocalTable] = $NULL$`);
- `orderBy` — `<STRING>`; —; No; —; —; maxLength=255; `automation[source.location] = restSource` and `automation[source.restSource] = sample` and `automation[externalFilterAndOrderBy.enabled] = Y` and (`automation[execution.actionsInitiatedOn] = rowsReturned` or `automation[execution.actionsInitiatedOn] = noRowsReturned`) and (`automation[restSynchronization.useLocalTable] = N` or `automation[restSynchronization.useLocalTable] = $NULL$`);

