# appProcess

- componentType: `appProcess`
- identifierRequired: true
- filePath: `shared-components/app-processes.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter the name of the process for easy identification by developers.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; `NATIVE_PLSQL`; `<enum:[executeCode:"PE.PROPERTY.APP_PROCESS_TYPE.LOV.NATIVE_PLSQL.D"]>`; —; —;

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

- `errorMessage` — `<STRING>`; Enter the error message for this process. This message displays if an unhandled exception is raised. After any error processing stops, a rollback is issued and an error message displays. Note: the SQL error message sqlerrm displays by default if On Error Page is defined as the error display location, there is no need to add #SQLERRM# to your error text. Error messages can include the following substitution strings:    #SQLERRM_TEXT#   Text of error message without the error number.   #SQLERRM#   Complete error message. ; No; —; —; maxLength=4000; —;
- `displayLocation` — `<STRING>`; —; Yes; `INLINE_IN_NOTIFICATION`; `<enum:[inlineInNotification:"Inline in Notification", onErrorPage:"On Error Page"]>`; —; `appProcess[execution.point] = afterSubmit` or `appProcess[execution.point] = processing`;

### source

- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL"]>`; —; `appProcess[identification.type] = executeCode`;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `appProcess[identification.type] = executeCode` and `appProcess[source.location] = restEnabledSql`;
- `plsqlCode` — `<STRING>`; Enter the PL/SQL code to be executed on the remote database.; Yes; —; —; —; `appProcess[identification.type] = executeCode` and `appProcess[source.location] = restEnabledSql`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `appProcess[identification.type] = executeCode` and `appProcess[source.location] = localDatabase`;
- `plsqlCode` — `<STRING>`; —; Yes; —; —; —; `appProcess[identification.type] = executeCode` and `appProcess[source.location] = localDatabase` and `appProcess[source.language] = plsql`;
- `javaScriptCode` — `<STRING>`; —; Yes; —; —; —; `appProcess[identification.type] = executeCode` and `appProcess[source.location] = localDatabase` and `appProcess[source.language] = javaScript-mle`;

