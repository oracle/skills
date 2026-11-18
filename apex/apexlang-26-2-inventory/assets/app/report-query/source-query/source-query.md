# sourceQuery

- componentType: `sourceQuery`
- identifierRequired: false

## Properties

### identification (direct group)

- `name` — `<STRING>`; Name of this report query source.; Yes; —; —; maxLength=255; —;
- `sequence` — `<INTEGER>`; —; Yes; —; —; —; —;

### dataLoop

- `name` — `<STRING>`; —; No; —; —; maxLength=255; —;

### source

- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL", restSource:"REST Source", jsonDualityView:"JSON Duality View", jsonSource:"JSON Source", sampleData:"Sample Data"]>`; —; —;
- `sampleData` — `<STRING>`; —; Yes; —; `<enum:[employees:"Employees", tasks:"Tasks", products:"Products", projects:"Projects"]>`; —; `sourceQuery[source.location] = sampleData`;
- `jsonDualityView` — `<@jsonDualityView>`; —; Yes; —; —; lovType=COMPONENT; `sourceQuery[source.location] = jsonDualityView`;
- `jsonSource` — `<@jsonSource>`; —; Yes; —; —; lovType=COMPONENT; `sourceQuery[source.location] = jsonSource`;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `sourceQuery[source.location] = restEnabledSql`;
- `type` — `<STRING>`; —; Yes; `TABLE`; `<enum:[tableView:"Table / View", sqlQuery:"SQL Query", functionBody:"Function Body returning SQL Query", propertyGraph:"Property Graph"]>`; —; `sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`;
- `restSource` — `<@restDataSource>`; —; Yes; —; —; lovType=COMPONENT; `sourceQuery[source.location] = restSource`;
- `optimizerHint` — `<STRING>`; —; No; —; —; maxLength=255; `sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql` or `sourceQuery[source.location] = restSource` or `sourceQuery[source.location] = jsonDualityView` or `sourceQuery[source.location] = jsonSource`;
- `orderByClause` — `<STRING>`; —; No; —; —; maxLength=255; (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`) and (`sourceQuery[source.type] = tableView` or `sourceQuery[source.type] = propertyGraph`);
- `graphOwner` — `<STRING>`; —; No; —; —; —; `sourceQuery[source.type] = propertyGraph` and (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`);
- `graphName` — `<STRING>`; —; Yes; —; —; —; `sourceQuery[source.type] = propertyGraph` and (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`);
- `matchClause` — `<STRING>`; —; Yes; —; —; maxLength=4000; `sourceQuery[source.type] = propertyGraph` and (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`);
- `whereClause` — `<STRING>`; —; No; —; —; maxLength=4000; (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`) and (`sourceQuery[source.type] = propertyGraph` or `sourceQuery[source.type] = tableView`);
- `columnsClause` — `<STRING>`; —; Yes; —; —; maxLength=4000; `sourceQuery[source.type] = propertyGraph` and (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`);
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `sourceQuery[source.type] = functionBody` and (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`);
- `tableOwner` — `<STRING>`; —; No; —; —; —; `sourceQuery[source.type] = tableView` and (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`);
- `tableName` — `<STRING>`; —; Yes; —; —; maxLength=128; `sourceQuery[source.type] = tableView` and (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`);
- `sqlQuery` — `<STRING>`; Specify the SQL Query to define the report query:  select [col1], [col2], [col3], ...   from ...  where ...  order by ...   When the Report Query returns JSON and one or more columns are in a JSON format, then such columns can be aliased to indicate that the JSON value must not be encoded as a string in the resulting document:  select [col1], [col2] as "{}[col2]", ...   from ... ; Yes; —; —; —; `sourceQuery[source.type] = sqlQuery` and (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`);
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `sourceQuery[source.type] = functionBody` and `sourceQuery[source.language] = plsql` and (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`);
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `sourceQuery[source.type] = functionBody` and `sourceQuery[source.language] = javaScript-mle` and (`sourceQuery[source.location] = localDatabase` or `sourceQuery[source.location] = restEnabledSql`);

### remoteCache

- `caching` — `<STRING>`; —; No; —; `<enum:[allUsers:"For All Users", user:"By User", session:"By Session"]>`; —; `sourceQuery[source.location] = restEnabledSql`;
- `timeout` — `<STRING>`; —; Yes; —; —; maxLength=255; `sourceQuery[source.location] = restEnabledSql` and `sourceQuery[remoteCache.caching] = sample`;

### localPostProcessing

- `type` — `<STRING>`; —; No; —; `<enum:[whereOrderByClause:"Where/Order By Clause", sqlQuery:"SQL Query", plsqlFunctionBody:"PL/SQL Function Body returning SQL Query"]>`; —; `sourceQuery[source.location] = restSource` and `sourceQuery[source.restSource] = sample` or `sourceQuery[source.location] = jsonDualityView` and `sourceQuery[source.jsonDualityView] = sample` or `sourceQuery[source.location] = jsonSource` and `sourceQuery[source.jsonSource] = sample`;
- `whereClause` — `<STRING>`; —; No; —; —; maxLength=4000; `sourceQuery[localPostProcessing.type] = whereOrderByClause` and (`sourceQuery[source.location] = restSource` and `sourceQuery[source.restSource] = sample` or `sourceQuery[source.location] = jsonDualityView` and `sourceQuery[source.jsonDualityView] = sample` or `sourceQuery[source.location] = jsonSource` and `sourceQuery[source.jsonSource] = sample`);
- `orderByClause` — `<STRING>`; —; No; —; —; maxLength=255; `sourceQuery[localPostProcessing.type] = whereOrderByClause` and (`sourceQuery[source.location] = restSource` and `sourceQuery[source.restSource] = sample` or `sourceQuery[source.location] = jsonDualityView` and `sourceQuery[source.jsonDualityView] = sample` or `sourceQuery[source.location] = jsonSource` and `sourceQuery[source.jsonSource] = sample`);
- `sqlQuery` — `<STRING>`; —; Yes; —; —; —; `sourceQuery[localPostProcessing.type] = sqlQuery` and (`sourceQuery[source.location] = restSource` and `sourceQuery[source.restSource] = sample` or `sourceQuery[source.location] = jsonDualityView` and `sourceQuery[source.jsonDualityView] = sample` or `sourceQuery[source.location] = jsonSource` and `sourceQuery[source.jsonSource] = sample`);
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `sourceQuery[localPostProcessing.type] = plsqlFunctionBody` and (`sourceQuery[source.location] = jsonDualityView` and `sourceQuery[source.jsonDualityView] = sample` or `sourceQuery[source.location] = jsonSource` and `sourceQuery[source.jsonSource] = sample` or `sourceQuery[source.location] = restSource` and `sourceQuery[source.restSource] = sample`);
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `sourceQuery[localPostProcessing.type] = plsqlFunctionBody` and `sourceQuery[localPostProcessing.language] = plsql` and (`sourceQuery[source.location] = jsonDualityView` and `sourceQuery[source.jsonDualityView] = sample` or `sourceQuery[source.location] = jsonSource` and `sourceQuery[source.jsonSource] = sample` or `sourceQuery[source.location] = restSource` and `sourceQuery[source.restSource] = sample`);
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `sourceQuery[localPostProcessing.type] = plsqlFunctionBody` and `sourceQuery[localPostProcessing.language] = javaScript-mle` and (`sourceQuery[source.location] = jsonDualityView` and `sourceQuery[source.jsonDualityView] = sample` or `sourceQuery[source.location] = jsonSource` and `sourceQuery[source.jsonSource] = sample` or `sourceQuery[source.location] = restSource` and `sourceQuery[source.restSource] = sample`);

### dataProfile

- `nestedRows` — `<@dataProfileColumn>`; —; No; —; —; lovType=COMPONENT; `sourceQuery[source.location] = jsonDualityView` or `sourceQuery[source.location] = jsonSource` or `sourceQuery[source.location] = restSource`;

### restSynchronization

- `useLocalTable` — `<BOOLEAN>`; —; Yes; `N`; —; —; `sourceQuery[source.location] = restSource`;

### externalFilterAndOrderBy

- `enabled` — `<BOOLEAN>`; —; Yes; `N`; —; —; `sourceQuery[source.location] = restSource` and `sourceQuery[source.restSource] = sample` and (`sourceQuery[restSynchronization.useLocalTable] = N` or `sourceQuery[restSynchronization.useLocalTable] = $NULL$`);
- `filter` — `<STRING>`; —; No; —; —; maxLength=4000; `sourceQuery[source.location] = restSource` and `sourceQuery[source.restSource] = sample` and `sourceQuery[externalFilterAndOrderBy.enabled] = Y` and (`sourceQuery[restSynchronization.useLocalTable] = N` or `sourceQuery[restSynchronization.useLocalTable] = $NULL$`);
- `orderBy` — `<STRING>`; —; No; —; —; maxLength=255; `sourceQuery[source.location] = restSource` and `sourceQuery[source.restSource] = sample` and `sourceQuery[externalFilterAndOrderBy.enabled] = Y` and (`sourceQuery[restSynchronization.useLocalTable] = N` or `sourceQuery[restSynchronization.useLocalTable] = $NULL$`);

