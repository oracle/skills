# appComputation

- componentType: `appComputation`
- identifierRequired: true
- filePath: `shared-components/app-computations.apx`

## Properties

### subscription

- `master` — `<@appComputation>`; —; No; —; —; lovType=COMPONENT; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### execution

- `point` — `<STRING>`; —; Yes; `ON_NEW_INSTANCE`; `<enum:[newSession:"New Session", afterAuthentication:"After Authentication", beforeHeader:"Before Header", afterHeader:"After Header", beforeRegions:"Before Regions", afterRegions:"After Regions", beforeFooter:"Before Footer", afterFooter:"After Footer", afterSubmit:"After Submit"]>`; —; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### identification (direct group)

- `itemName` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[serverSideCondition.type] = rowsReturned` or `appComputation[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[serverSideCondition.type] = request=Value` or `appComputation[serverSideCondition.type] = request!=Value` or `appComputation[serverSideCondition.type] = requestIsContainedInValue` or `appComputation[serverSideCondition.type] = requestIsNotContainedInValue` or `appComputation[serverSideCondition.type] = currentLanguageIsContainedInValue` or `appComputation[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `appComputation[serverSideCondition.type] = currentLanguage!=value` or `appComputation[serverSideCondition.type] = currentLanguage=value` or `appComputation[serverSideCondition.type] = cgiEnvDadName=value` or `appComputation[serverSideCondition.type] = cgiEnvDadName!=value` or `appComputation[serverSideCondition.type] = cgiEnvServerName=value` or `appComputation[serverSideCondition.type] = cgiEnvServerName!=value` or `appComputation[serverSideCondition.type] = cgiEnvHttpHost=value` or `appComputation[serverSideCondition.type] = cgiEnvHttpHost!=value` or `appComputation[serverSideCondition.type] = item=value` or `appComputation[serverSideCondition.type] = item!=value` or `appComputation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `appComputation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `appComputation[serverSideCondition.type] = textIsContainedInValue` or `appComputation[serverSideCondition.type] = textIsNotContainedInValue` or `appComputation[serverSideCondition.type] = text=value` or `appComputation[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `appComputation[serverSideCondition.type] = item=value` or `appComputation[serverSideCondition.type] = item!=value` or `appComputation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `appComputation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `appComputation[serverSideCondition.type] = itemIsNull` or `appComputation[serverSideCondition.type] = itemIsNotNull` or `appComputation[serverSideCondition.type] = itemIsZero` or `appComputation[serverSideCondition.type] = itemIsNotZero` or `appComputation[serverSideCondition.type] = itemIsNullOrZero` or `appComputation[serverSideCondition.type] = itemIsNotNullAndNotZero` or `appComputation[serverSideCondition.type] = itemContainsNoSpaces` or `appComputation[serverSideCondition.type] = itemIsNumeric` or `appComputation[serverSideCondition.type] = itemIsNotNumeric` or `appComputation[serverSideCondition.type] = itemIsAlphanumeric` or `appComputation[serverSideCondition.type] = itemIsInColonDelimitedList` or `appComputation[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `appComputation[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[serverSideCondition.type] = itemIsInColonDelimitedList` or `appComputation[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `appComputation[serverSideCondition.type] = userPreference=value` or `appComputation[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `appComputation[serverSideCondition.type] = currentPage=page` or `appComputation[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `appComputation[serverSideCondition.type] = currentPageInList` or `appComputation[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[serverSideCondition.type] = textIsContainedInItem` or `appComputation[serverSideCondition.type] = textIsContainedInValue` or `appComputation[serverSideCondition.type] = textIsNotContainedInValue` or `appComputation[serverSideCondition.type] = text=value` or `appComputation[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `appComputation[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `appComputation[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[serverSideCondition.type] = expression` and `appComputation[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[serverSideCondition.type] = expression` and `appComputation[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[serverSideCondition.type] = expression` and `appComputation[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[serverSideCondition.type] = functionBody` and `appComputation[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[serverSideCondition.type] = functionBody` and `appComputation[serverSideCondition.language] = javaScript-mle`;

### computation

- `type` — `<STRING>`; —; Yes; `STATIC_ASSIGNMENT`; `<enum:[staticValue:"Static Value", item:"Item", sqlQuerySingleValue:"SQL Query (return single value)", sqlQueryMultipleValues:"SQL Query (return multiple values)", expression:"Expression", functionBody:"Function Body", preference:"Preference"]>`; —; —;
- `computationProcessed` — `<STRING>`; —; No; —; `<enum:[newSession:"New Session", replaceExisting:"Replace Existing", addToExisting:"Add To Existing", raiseErrorOnReplace:"Raise Error On Replace", replaceNullValues:"Replace Null Values"]>`; —; —;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `appComputation[computation.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `appComputation[computation.type] = functionBody`;
- `staticValue` — `<STRING>`; —; No; —; —; maxLength=4000; `appComputation[computation.type] = staticValue`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[computation.type] = sqlQuerySingleValue` or `appComputation[computation.type] = sqlQueryMultipleValues`;
- `itemName` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `appComputation[computation.type] = item`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[computation.type] = preference`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[computation.type] = expression` and `appComputation[computation.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[computation.type] = expression` and `appComputation[computation.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[computation.type] = expression` and `appComputation[computation.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[computation.type] = functionBody` and `appComputation[computation.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `appComputation[computation.type] = functionBody` and `appComputation[computation.language] = javaScript-mle`;

### error

- `errorMessage` — `<STRING>`; Enter an error message that displays if this computation fails.     Use #SQLERRM# as a substitution string for the SQL error message resulting from a failed computation.     Computations are designed to always succeed, and only fail due to unanticipated errors.     It is not advisable to implement a computation that regularly fails and acts as a pseudo-validation utilizing this error message.; No; —; —; maxLength=4000; —;

