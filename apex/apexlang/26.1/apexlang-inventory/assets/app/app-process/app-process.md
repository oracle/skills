# appProcess

- componentType: `appProcess`
- identifierRequired: true
- filePath: `shared-components/app-processes.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[autoRowFetch, autoRowFetch, autoRowProcessing, autoRowProcessing, clearSessionState, clearSessionState, closeDialog, closeDialog, dataLoading, dataLoading, download, download, executeCode, executeCode, executionChain, executionChain, formAutoRowProcessing, formAutoRowProcessing, formInitialization, formInitialization, formPagination, formPagination, generateTextWithAi, generateTextWithAi, humanTaskCreate, humanTaskCreate, humanTaskManage, humanTaskManage, interactiveGridAutoRowProcessing, interactiveGridAutoRowProcessing, invokeApi, invokeApi, invokeWorkflow, invokeWorkflow, legacyAutoRowProcessing, legacyAutoRowProcessing, legacyWebService, legacyWebService, loadUploadedData, loadUploadedData, parallelFlow, parallelFlow, parseUploadedData, parseUploadedData, prepareUploadedData, prepareUploadedData, printReport, printReport, resetPagination, resetPagination, sendEMail, sendEMail, sendPushNotification, sendPushNotification, serverSideGeocoding, serverSideGeocoding, switch, switch, tabformAddRows, tabformAddRows, tabformDelete, tabformDelete, tabformUpdate, tabformUpdate, userPreferences, userPreferences, wait, wait, webService, webService, workflow, workflow, workflowEnd, workflowEnd, workflowStart, workflowStart]>`; —; —;

### execution

- `point` — `<STRING>`; —; Yes; `BEFORE_HEADER`; `<enum:[afterAuthentication:"After Authentication", newSession:"New Session", beforeHeader:"Before Header", afterHeader:"After Header", beforeRegions:"Before Regions", afterRegions:"After Regions", beforeFooter:"Before Footer", afterFooter:"After Footer", afterSubmit:"After Submit", processing:"Processing", ajaxCallback:"Ajax Callback"]>`; —; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### subscription

- `master` — `<@appProcess>`; —; No; —; —; lovType=COMPONENT; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appProcess[serverSideCondition.type] = rowsReturned` or `appProcess[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appProcess[serverSideCondition.type] = request=Value` or `appProcess[serverSideCondition.type] = request!=Value` or `appProcess[serverSideCondition.type] = requestIsContainedInValue` or `appProcess[serverSideCondition.type] = requestIsNotContainedInValue` or `appProcess[serverSideCondition.type] = currentLanguageIsContainedInValue` or `appProcess[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `appProcess[serverSideCondition.type] = currentLanguage!=value` or `appProcess[serverSideCondition.type] = currentLanguage=value` or `appProcess[serverSideCondition.type] = cgiEnvDadName=value` or `appProcess[serverSideCondition.type] = cgiEnvDadName!=value` or `appProcess[serverSideCondition.type] = cgiEnvServerName=value` or `appProcess[serverSideCondition.type] = cgiEnvServerName!=value` or `appProcess[serverSideCondition.type] = cgiEnvHttpHost=value` or `appProcess[serverSideCondition.type] = cgiEnvHttpHost!=value` or `appProcess[serverSideCondition.type] = item=value` or `appProcess[serverSideCondition.type] = item!=value` or `appProcess[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `appProcess[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `appProcess[serverSideCondition.type] = textIsContainedInValue` or `appProcess[serverSideCondition.type] = textIsNotContainedInValue` or `appProcess[serverSideCondition.type] = text=value` or `appProcess[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `appProcess[serverSideCondition.type] = item=value` or `appProcess[serverSideCondition.type] = item!=value` or `appProcess[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `appProcess[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `appProcess[serverSideCondition.type] = itemIsNull` or `appProcess[serverSideCondition.type] = itemIsNotNull` or `appProcess[serverSideCondition.type] = itemIsZero` or `appProcess[serverSideCondition.type] = itemIsNotZero` or `appProcess[serverSideCondition.type] = itemIsNullOrZero` or `appProcess[serverSideCondition.type] = itemIsNotNullAndNotZero` or `appProcess[serverSideCondition.type] = itemContainsNoSpaces` or `appProcess[serverSideCondition.type] = itemIsNumeric` or `appProcess[serverSideCondition.type] = itemIsNotNumeric` or `appProcess[serverSideCondition.type] = itemIsAlphanumeric` or `appProcess[serverSideCondition.type] = itemIsInColonDelimitedList` or `appProcess[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `appProcess[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appProcess[serverSideCondition.type] = itemIsInColonDelimitedList` or `appProcess[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `appProcess[serverSideCondition.type] = userPreference=value` or `appProcess[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `appProcess[serverSideCondition.type] = currentPage=page` or `appProcess[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `appProcess[serverSideCondition.type] = currentPageInList` or `appProcess[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appProcess[serverSideCondition.type] = textIsContainedInItem` or `appProcess[serverSideCondition.type] = textIsContainedInValue` or `appProcess[serverSideCondition.type] = textIsNotContainedInValue` or `appProcess[serverSideCondition.type] = text=value` or `appProcess[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `appProcess[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `appProcess[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appProcess[serverSideCondition.type] = expression` and `appProcess[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appProcess[serverSideCondition.type] = expression` and `appProcess[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appProcess[serverSideCondition.type] = expression` and `appProcess[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appProcess[serverSideCondition.type] = functionBody` and `appProcess[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appProcess[serverSideCondition.type] = functionBody` and `appProcess[serverSideCondition.language] = javaScript-mle`;

### error

- `errorMessage` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `displayLocation` — `<STRING>`; —; Yes; `INLINE_IN_NOTIFICATION`; `<enum:[inlineInNotification:"Inline in Notification", onErrorPage:"On Error Page"]>`; —; `appProcess[execution.point] = afterSubmit` or `appProcess[execution.point] = processing`;

### source

- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL"]>`; —; `appProcess[identification.type] = executeCode`;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `appProcess[identification.type] = executeCode` and `appProcess[source.location] = restEnabledSql`;
- `plsqlCode` — `<STRING>`; —; Yes; —; —; —; `appProcess[identification.type] = executeCode` and `appProcess[source.location] = restEnabledSql` or `appProcess[identification.type] = executeCode` and `appProcess[source.location] = localDatabase` and `appProcess[source.language] = plsql`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `appProcess[identification.type] = executeCode` and `appProcess[source.location] = localDatabase`;
- `javaScriptCode` — `<STRING>`; —; Yes; —; —; —; `appProcess[identification.type] = executeCode` and `appProcess[source.location] = localDatabase` and `appProcess[source.language] = javaScript-mle`;

