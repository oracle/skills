# computation

- componentType: `computation`
- identifierRequired: true

## Properties

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### identification (direct group)

- `itemName` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[serverSideCondition.type] = rowsReturned` or `computation[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[serverSideCondition.type] = request=Value` or `computation[serverSideCondition.type] = request!=Value` or `computation[serverSideCondition.type] = requestIsContainedInValue` or `computation[serverSideCondition.type] = requestIsNotContainedInValue` or `computation[serverSideCondition.type] = currentLanguageIsContainedInValue` or `computation[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `computation[serverSideCondition.type] = currentLanguage!=value` or `computation[serverSideCondition.type] = currentLanguage=value` or `computation[serverSideCondition.type] = cgiEnvDadName=value` or `computation[serverSideCondition.type] = cgiEnvDadName!=value` or `computation[serverSideCondition.type] = cgiEnvServerName=value` or `computation[serverSideCondition.type] = cgiEnvServerName!=value` or `computation[serverSideCondition.type] = cgiEnvHttpHost=value` or `computation[serverSideCondition.type] = cgiEnvHttpHost!=value` or `computation[serverSideCondition.type] = item=value` or `computation[serverSideCondition.type] = item!=value` or `computation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `computation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `computation[serverSideCondition.type] = textIsContainedInValue` or `computation[serverSideCondition.type] = textIsNotContainedInValue` or `computation[serverSideCondition.type] = text=value` or `computation[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `computation[serverSideCondition.type] = item=value` or `computation[serverSideCondition.type] = item!=value` or `computation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `computation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `computation[serverSideCondition.type] = itemIsNull` or `computation[serverSideCondition.type] = itemIsNotNull` or `computation[serverSideCondition.type] = itemIsZero` or `computation[serverSideCondition.type] = itemIsNotZero` or `computation[serverSideCondition.type] = itemIsNullOrZero` or `computation[serverSideCondition.type] = itemIsNotNullAndNotZero` or `computation[serverSideCondition.type] = itemContainsNoSpaces` or `computation[serverSideCondition.type] = itemIsNumeric` or `computation[serverSideCondition.type] = itemIsNotNumeric` or `computation[serverSideCondition.type] = itemIsAlphanumeric` or `computation[serverSideCondition.type] = itemIsInColonDelimitedList` or `computation[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `computation[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[serverSideCondition.type] = itemIsInColonDelimitedList` or `computation[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `computation[serverSideCondition.type] = userPreference=value` or `computation[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `computation[serverSideCondition.type] = currentPage=page` or `computation[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `computation[serverSideCondition.type] = currentPageInList` or `computation[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[serverSideCondition.type] = textIsContainedInItem` or `computation[serverSideCondition.type] = textIsContainedInValue` or `computation[serverSideCondition.type] = textIsNotContainedInValue` or `computation[serverSideCondition.type] = text=value` or `computation[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `computation[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `computation[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[serverSideCondition.type] = expression` and `computation[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[serverSideCondition.type] = expression` and `computation[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[serverSideCondition.type] = expression` and `computation[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[serverSideCondition.type] = functionBody` and `computation[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[serverSideCondition.type] = functionBody` and `computation[serverSideCondition.language] = javaScript-mle`;

### computation

- `type` — `<STRING>`; —; Yes; `QUERY`; `<enum:[staticValue:"Static Value", item:"Item", sqlQuerySingleValue:"SQL Query (return single value)", sqlQueryMultipleValues:"SQL Query (return multiple values)", expression:"Expression", functionBody:"Function Body", preference:"Preference"]>`; —; —;
- `computationProcessed` — `<STRING>`; —; No; —; `<enum:[newSession:"New Session", replaceExisting:"Replace Existing", addToExisting:"Add To Existing", raiseErrorOnReplace:"Raise Error On Replace", replaceNullValues:"Replace Null Values"]>`; —; —;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `computation[computation.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `computation[computation.type] = functionBody`;
- `staticValue` — `<STRING>`; —; No; —; —; maxLength=4000; `computation[computation.type] = staticValue`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[computation.type] = sqlQuerySingleValue` or `computation[computation.type] = sqlQueryMultipleValues`;
- `itemName` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `computation[computation.type] = item`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[computation.type] = preference`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[computation.type] = expression` and `computation[computation.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[computation.type] = expression` and `computation[computation.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[computation.type] = expression` and `computation[computation.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[computation.type] = functionBody` and `computation[computation.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `computation[computation.type] = functionBody` and `computation[computation.language] = javaScript-mle`;

### error

- `errorMessage` — `<STRING>`; Enter an error message that displays if this computation fails.     Use #SQLERRM# as a substitution string for the SQL error message resulting from a failed computation.     Computations are designed to always succeed, and only fail due to unanticipated errors.     It is not advisable to implement a computation that regularly fails and acts as a pseudo-validation utilizing this error message.; No; —; —; maxLength=4000; —;

### execution

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `point` — `<STRING>`; —; Yes; `BEFORE_BOX_BODY`; `<enum:[newSession:"New Session", beforeHeader:"Before Header", afterHeader:"After Header", beforeRegions:"Before Regions", afterRegions:"After Regions", beforeFooter:"Before Footer", afterFooter:"After Footer", afterSubmit:"After Submit"]>`; —; —;

