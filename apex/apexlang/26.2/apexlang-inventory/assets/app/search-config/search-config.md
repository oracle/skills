# searchConfig

- componentType: `searchConfig`
- identifierRequired: true
- filePath: `shared-components/search-configs/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Display Name for this Search Configuration.; Yes; —; —; maxLength=255; —;
- `searchQueryPrefix` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; `SIMPLE`; `<enum:[simple:"Simple (APEX Data Source)", vector:"Oracle AI Vector Search", text:"Oracle Text (Manual)", ubiquitous:"Oracle Ubiquitous Search", apexList:"APEX List"]>`; —; —;

### iconAndBadge

- `iconSource` — `<STRING>`; —; No; —; `<enum:[initials:"Initials", iconClass:"Icon Class", iconClassColumn:"Icon Class Column", imageUrl:"Image URL", imageBlobColumn:"Image BLOB Column"]>`; —; —;
- `iconColumn` — `<STRING>`; —; Yes; —; —; —; `searchConfig[iconAndBadge.iconSource] = iconClassColumn`;
- `imageColumn` — `<STRING>`; —; Yes; —; —; —; `searchConfig[iconAndBadge.iconSource] = imageBlobColumn`;
- `imageUrl` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[iconAndBadge.iconSource] = imageUrl`;
- `iconCssClasses` — `<STRING>`; —; No; —; —; maxLength=255; `searchConfig[iconAndBadge.iconSource] = iconClass`;

### columnMapping

- `primaryKey1Column` — `<STRING>`; —; Yes; —; —; —; —;
- `primaryKey2Column` — `<STRING>`; —; No; —; —; —; —;
- `titleColumn` — `<STRING>`; —; Yes; —; —; —; —;
- `subtitleColumn` — `<STRING>`; —; No; —; —; —; —;
- `descriptionColumn` — `<STRING>`; —; No; —; —; —; —;
- `badgeColumn` — `<STRING>`; —; No; —; —; —; —;
- `lastModifiedColumn` — `<STRING>`; —; No; —; —; —; —;
- `customColumn1` — `<STRING>`; —; No; —; —; —; —;
- `customColumn2` — `<STRING>`; —; No; —; —; —; —;
- `customColumn3` — `<STRING>`; —; No; —; —; —; —;
- `scoreColumn` — `<STRING>`; —; No; —; —; —; —;
- `mimeTypeColumn` — `<STRING>`; —; No; —; —; —; `searchConfig[iconAndBadge.iconSource] = imageBlobColumn` and `searchConfig[iconAndBadge.imageColumn] = sample`;

### subscription

- `master` — `<@searchConfig>`; —; No; —; —; lovType=COMPONENT; —;

### advanced

- `staticId` — `<STRING>`; Static ID for this search configuration. The static ID is used when using the search configuration in a programmatic context, with the APEX_SEARCH package.; Yes; —; —; maxLength=255; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### columnFormatting

- `htmlExpression` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### messages

- `whenNoDataFound` — `<STRING>`; The message to return when no results have been found for this search configuration.; No; —; —; maxLength=4000; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[serverSideCondition.type] = rowsReturned` or `searchConfig[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[serverSideCondition.type] = request=Value` or `searchConfig[serverSideCondition.type] = request!=Value` or `searchConfig[serverSideCondition.type] = requestIsContainedInValue` or `searchConfig[serverSideCondition.type] = requestIsNotContainedInValue` or `searchConfig[serverSideCondition.type] = currentLanguageIsContainedInValue` or `searchConfig[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `searchConfig[serverSideCondition.type] = currentLanguage!=value` or `searchConfig[serverSideCondition.type] = currentLanguage=value` or `searchConfig[serverSideCondition.type] = cgiEnvDadName=value` or `searchConfig[serverSideCondition.type] = cgiEnvDadName!=value` or `searchConfig[serverSideCondition.type] = cgiEnvServerName=value` or `searchConfig[serverSideCondition.type] = cgiEnvServerName!=value` or `searchConfig[serverSideCondition.type] = cgiEnvHttpHost=value` or `searchConfig[serverSideCondition.type] = cgiEnvHttpHost!=value` or `searchConfig[serverSideCondition.type] = item=value` or `searchConfig[serverSideCondition.type] = item!=value` or `searchConfig[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `searchConfig[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `searchConfig[serverSideCondition.type] = textIsContainedInValue` or `searchConfig[serverSideCondition.type] = textIsNotContainedInValue` or `searchConfig[serverSideCondition.type] = text=value` or `searchConfig[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `searchConfig[serverSideCondition.type] = item=value` or `searchConfig[serverSideCondition.type] = item!=value` or `searchConfig[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `searchConfig[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `searchConfig[serverSideCondition.type] = itemIsNull` or `searchConfig[serverSideCondition.type] = itemIsNotNull` or `searchConfig[serverSideCondition.type] = itemIsZero` or `searchConfig[serverSideCondition.type] = itemIsNotZero` or `searchConfig[serverSideCondition.type] = itemIsNullOrZero` or `searchConfig[serverSideCondition.type] = itemIsNotNullAndNotZero` or `searchConfig[serverSideCondition.type] = itemContainsNoSpaces` or `searchConfig[serverSideCondition.type] = itemIsNumeric` or `searchConfig[serverSideCondition.type] = itemIsNotNumeric` or `searchConfig[serverSideCondition.type] = itemIsAlphanumeric` or `searchConfig[serverSideCondition.type] = itemIsInColonDelimitedList` or `searchConfig[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `searchConfig[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[serverSideCondition.type] = itemIsInColonDelimitedList` or `searchConfig[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `searchConfig[serverSideCondition.type] = userPreference=value` or `searchConfig[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `searchConfig[serverSideCondition.type] = currentPage=page` or `searchConfig[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `searchConfig[serverSideCondition.type] = currentPageInList` or `searchConfig[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[serverSideCondition.type] = textIsContainedInItem` or `searchConfig[serverSideCondition.type] = textIsContainedInValue` or `searchConfig[serverSideCondition.type] = textIsNotContainedInValue` or `searchConfig[serverSideCondition.type] = text=value` or `searchConfig[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `searchConfig[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `searchConfig[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[serverSideCondition.type] = expression` and `searchConfig[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[serverSideCondition.type] = expression` and `searchConfig[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[serverSideCondition.type] = expression` and `searchConfig[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[serverSideCondition.type] = functionBody` and `searchConfig[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[serverSideCondition.type] = functionBody` and `searchConfig[serverSideCondition.language] = javaScript-mle`;

### performance

- `maxRowsToReturn` — `<INTEGER>`; —; No; —; —; —; —;

### appearance

- `cssClasses` — `<STRING>`; Enter the CSS Classes to be applied to each result. In row templates, this value will be available as the RESULT_CSS_CLASSES substitution.; No; —; —; maxLength=255; —;
- `maxVectorDistance` — `<INTEGER>`; —; No; —; —; —; `searchConfig[identification.type] = vector`;

### link

- `type` — `<STRING>`; Select the action to be performed when an entry in the result list is clicked.; No; —; `<enum:[redirectThisApp:"Redirect to Page in this Application", redirectOtherApp:"Redirect to Page in a different Application", redirectUrl:"Redirect to URL", redirectUrlReturnedByFirstCol:"Redirect to URL returned by First Column"]>`; —; —;
- `target` — `<COMPLEX>`; —; Yes; —; —; —; `searchConfig[link.type] = redirectThisApp` or `searchConfig[link.type] = redirectOtherApp`;
- `targetUrl` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[link.type] = redirectUrl`;

### source

- `oracleTextIndexColumn` — `<STRING>`; —; Yes; —; —; —; `searchConfig[identification.type] = text`;
- `searchableColumns` — `<STRING>`; —; No; —; —; —; `searchConfig[identification.type] = simple`;
- `type` — `<STRING>`; —; Yes; `TABLE`; `<enum:[tableView:"Table / View", sqlQuery:"SQL Query"]>`; —; `searchConfig[identification.type] = text` or `searchConfig[identification.type] = vector`;
- `searchIndexOwner` — `<STRING>`; —; No; —; —; —; `searchConfig[identification.type] = ubiquitous`;
- `searchIndexName` — `<STRING>`; —; No; —; —; —; `searchConfig[identification.type] = ubiquitous`;
- `searchSourceOwner` — `<STRING>`; —; No; —; —; —; `searchConfig[identification.type] = ubiquitous`;
- `searchSourceName` — `<STRING>`; —; Yes; —; —; —; `searchConfig[identification.type] = ubiquitous`;
- `list` — `<@list>`; —; Yes; —; —; lovType=COMPONENT; `searchConfig[identification.type] = apexList`;
- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL", restSource:"REST Source", jsonDualityView:"JSON Duality View", jsonSource:"JSON Source", sampleData:"Sample Data"]>`; —; `searchConfig[identification.type] = simple`;
- `sampleData` — `<STRING>`; —; Yes; —; `<enum:[employees:"Employees", tasks:"Tasks", products:"Products", projects:"Projects"]>`; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = sampleData`;
- `restSourceQueryFunction` — `<STRING>`; —; No; —; —; —; `searchConfig[identification.type] = simple` and `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource`;
- `tableOwner` — `<STRING>`; —; No; —; —; —; `searchConfig[identification.type] = text` and `searchConfig[identification.type] = text` and `searchConfig[source.type] = tableView` or `searchConfig[identification.type] = text` and `searchConfig[identification.type] = vector` and `searchConfig[source.type] = tableView` or `searchConfig[identification.type] = vector` and `searchConfig[identification.type] = text` and `searchConfig[source.type] = tableView` or `searchConfig[identification.type] = vector` and `searchConfig[identification.type] = vector` and `searchConfig[source.type] = tableView` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = tableView` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = tableView`;
- `tableName` — `<STRING>`; —; Yes; —; —; —; `searchConfig[identification.type] = text` and `searchConfig[identification.type] = text` and `searchConfig[source.type] = tableView` or `searchConfig[identification.type] = text` and `searchConfig[identification.type] = vector` and `searchConfig[source.type] = tableView` or `searchConfig[identification.type] = vector` and `searchConfig[identification.type] = text` and `searchConfig[source.type] = tableView` or `searchConfig[identification.type] = vector` and `searchConfig[identification.type] = vector` and `searchConfig[source.type] = tableView`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[identification.type] = text` and `searchConfig[identification.type] = text` and `searchConfig[source.type] = sqlQuery` or `searchConfig[identification.type] = text` and `searchConfig[identification.type] = vector` and `searchConfig[source.type] = sqlQuery`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; —; `searchConfig[identification.type] = vector` and `searchConfig[identification.type] = text` and `searchConfig[source.type] = sqlQuery` or `searchConfig[identification.type] = vector` and `searchConfig[identification.type] = vector` and `searchConfig[source.type] = sqlQuery` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = sqlQuery` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = sqlQuery`;
- `jsonDualityView` — `<@jsonDualityView>`; —; Yes; —; —; lovType=COMPONENT; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonDualityView`;
- `jsonSource` — `<@jsonSource>`; —; Yes; —; —; lovType=COMPONENT; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonSource`;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql`;
- `type` — `<STRING>`; —; Yes; `TABLE`; `<enum:[tableView:"Table / View", sqlQuery:"SQL Query", functionBody:"Function Body returning SQL Query", propertyGraph:"Property Graph"]>`; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql`;
- `restSource` — `<@restDataSource>`; —; Yes; —; —; lovType=COMPONENT; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource`;
- `optimizerHint` — `<STRING>`; —; No; —; —; maxLength=255; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonDualityView` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonSource`;
- `whereClause` — `<STRING>`; —; No; —; —; maxLength=4000; `searchConfig[identification.type] = text` and `searchConfig[identification.type] = text` and `searchConfig[source.type] = tableView` and `searchConfig[source.tableName] = sample` or `searchConfig[identification.type] = text` and `searchConfig[identification.type] = vector` and `searchConfig[source.type] = tableView` and `searchConfig[source.tableName] = sample` or `searchConfig[identification.type] = vector` and `searchConfig[identification.type] = text` and `searchConfig[source.type] = tableView` and `searchConfig[source.tableName] = sample` or `searchConfig[identification.type] = vector` and `searchConfig[identification.type] = vector` and `searchConfig[source.type] = tableView` and `searchConfig[source.tableName] = sample` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = propertyGraph` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = propertyGraph` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = tableView` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = tableView`;
- `graphOwner` — `<STRING>`; —; No; —; —; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = propertyGraph` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = propertyGraph`;
- `graphName` — `<STRING>`; —; Yes; —; —; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = propertyGraph` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = propertyGraph`;
- `matchClause` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = propertyGraph` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = propertyGraph`;
- `columnsClause` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = propertyGraph` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = propertyGraph`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = functionBody` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = functionBody`;
- `tableName` — `<STRING>`; —; Yes; —; —; maxLength=128; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = tableView` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = tableView`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = functionBody` and `searchConfig[source.language] = plsql` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = functionBody` and `searchConfig[source.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = localDatabase` and `searchConfig[source.type] = functionBody` and `searchConfig[source.language] = javaScript-mle` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restEnabledSql` and `searchConfig[source.type] = functionBody` and `searchConfig[source.language] = javaScript-mle`;

### vectorAttributes

- `provider` — `<@vectorProvider>`; —; Yes; —; —; lovType=COMPONENT; `searchConfig[identification.type] = vector`;
- `columnName` — `<STRING>`; —; Yes; —; —; maxLength=128; `searchConfig[identification.type] = vector`;
- `searchType` — `<STRING>`; —; Yes; `EXACT`; `<enum:[exact:"Exact", approx:"Approx"]>`; —; `searchConfig[identification.type] = vector`;
- `distanceMetric` — `<STRING>`; —; Yes; `COSINE`; `<enum:[cosine:"Cosine", dot:"Dot", euclidean:"Euclidean", euclideanSquared:"Euclidean Squared", hamming:"Hamming", manhattan:"Manhattan"]>`; —; `searchConfig[identification.type] = vector`;
- `targetAccuracy` — `<INTEGER>`; —; Yes; `85`; —; —; `searchConfig[identification.type] = vector` and `searchConfig[identification.type] = vector` and `searchConfig[vectorAttributes.searchType] = approx`;

### rowSearch

- `textQueryFunction` — `<STRING>`; —; No; —; `<enum:[searchEngine:"Search Engine", expertSearch:"Expert Search", custom:"Custom"]>`; —; `searchConfig[identification.type] = text` or `searchConfig[identification.type] = ubiquitous`;
- `customFunctionName` — `<STRING>`; —; Yes; —; —; maxLength=255; `searchConfig[identification.type] = text` and `searchConfig[identification.type] = text` and `searchConfig[rowSearch.textQueryFunction] = custom` or `searchConfig[identification.type] = text` and `searchConfig[identification.type] = ubiquitous` and `searchConfig[rowSearch.textQueryFunction] = custom` or `searchConfig[identification.type] = ubiquitous` and `searchConfig[identification.type] = text` and `searchConfig[rowSearch.textQueryFunction] = custom` or `searchConfig[identification.type] = ubiquitous` and `searchConfig[identification.type] = ubiquitous` and `searchConfig[rowSearch.textQueryFunction] = custom`;

### orderBy

- `orderByClause` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### localPostProcessing

- `type` — `<STRING>`; —; No; —; `<enum:[whereOrderByClause:"Where/Order By Clause", sqlQuery:"SQL Query", plsqlFunctionBody:"PL/SQL Function Body returning SQL Query"]>`; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource` and `searchConfig[source.restSource] = sample` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonDualityView` and `searchConfig[source.jsonDualityView] = sample` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonSource` and `searchConfig[source.jsonSource] = sample`;
- `whereClause` — `<STRING>`; —; No; —; —; maxLength=4000; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource` and `searchConfig[source.restSource] = sample` and `searchConfig[localPostProcessing.type] = whereOrderByClause` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonDualityView` and `searchConfig[source.jsonDualityView] = sample` and `searchConfig[localPostProcessing.type] = whereOrderByClause` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonSource` and `searchConfig[source.jsonSource] = sample` and `searchConfig[localPostProcessing.type] = whereOrderByClause`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource` and `searchConfig[source.restSource] = sample` and `searchConfig[localPostProcessing.type] = sqlQuery` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonDualityView` and `searchConfig[source.jsonDualityView] = sample` and `searchConfig[localPostProcessing.type] = sqlQuery` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonSource` and `searchConfig[source.jsonSource] = sample` and `searchConfig[localPostProcessing.type] = sqlQuery`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonDualityView` and `searchConfig[source.jsonDualityView] = sample` and `searchConfig[localPostProcessing.type] = plsqlFunctionBody` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonSource` and `searchConfig[source.jsonSource] = sample` and `searchConfig[localPostProcessing.type] = plsqlFunctionBody` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource` and `searchConfig[source.restSource] = sample` and `searchConfig[localPostProcessing.type] = plsqlFunctionBody`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonDualityView` and `searchConfig[source.jsonDualityView] = sample` and `searchConfig[localPostProcessing.type] = plsqlFunctionBody` and `searchConfig[localPostProcessing.language] = plsql` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonSource` and `searchConfig[source.jsonSource] = sample` and `searchConfig[localPostProcessing.type] = plsqlFunctionBody` and `searchConfig[localPostProcessing.language] = plsql` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource` and `searchConfig[source.restSource] = sample` and `searchConfig[localPostProcessing.type] = plsqlFunctionBody` and `searchConfig[localPostProcessing.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonDualityView` and `searchConfig[source.jsonDualityView] = sample` and `searchConfig[localPostProcessing.type] = plsqlFunctionBody` and `searchConfig[localPostProcessing.language] = javaScript-mle` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonSource` and `searchConfig[source.jsonSource] = sample` and `searchConfig[localPostProcessing.type] = plsqlFunctionBody` and `searchConfig[localPostProcessing.language] = javaScript-mle` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource` and `searchConfig[source.restSource] = sample` and `searchConfig[localPostProcessing.type] = plsqlFunctionBody` and `searchConfig[localPostProcessing.language] = javaScript-mle`;

### externalFilter

- `enabled` — `<BOOLEAN>`; —; Yes; `N`; —; —; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource` and `searchConfig[source.restSource] = sample`;
- `filter` — `<STRING>`; —; No; —; —; maxLength=4000; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource` and `searchConfig[source.restSource] = sample` and `searchConfig[externalFilter.enabled] = Y`;

### dataProfile

- `nestedRows` — `<@dataProfileColumn>`; —; No; —; —; lovType=COMPONENT; `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonDualityView` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = jsonSource` or `searchConfig[identification.type] = simple` and `searchConfig[source.location] = restSource`;

