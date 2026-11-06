# branch

- componentType: `branch`
- identifierRequired: false

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter the name of the branch for easy identification by developers.; No; —; —; maxLength=255; —;

### behavior

- `type` — `<STRING>`; —; Yes; `REDIRECT_URL`; `<enum:[pageOrUrl:"Page or URL (Redirect)", urlIdentifiedByItem:"URL Identified by Item (Redirect)", functionReturningUrl:"Function Returning a URL (Redirect)", page:"Page (Show only)", pageIdentifiedByItem:"Page Identified by Item (Show only)", functionReturningPage:"Function Returning a Page (Show only)", plsqlProcedure:"PL/SQL procedure [Legacy]", pageProcessing:"Page Processing {not common}"]>`; —; —;
- `target` — `<COMPLEX>`; —; Yes; —; —; —; `branch[behavior.type] = pageOrUrl`;
- `pageNumber` — `<INTEGER>`; —; Yes; —; —; —; `branch[behavior.type] = page` or `branch[behavior.type] = pageProcessing`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `branch[behavior.type] = pageIdentifiedByItem` or `branch[behavior.type] = urlIdentifiedByItem`;
- `plsqlCode` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[behavior.type] = plsqlProcedure`;
- `saveStateBeforeBranching` — `<BOOLEAN>`; —; Yes; `N`; —; —; `branch[behavior.type] = pageOrUrl`;
- `request` — `<STRING>`; —; No; —; —; maxLength=128; `branch[behavior.type] = pageProcessing`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `branch[behavior.type] = functionReturningPage` or `branch[behavior.type] = functionReturningUrl`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[behavior.type] = functionReturningPage` and `branch[behavior.language] = plsql` or `branch[behavior.type] = functionReturningUrl` and `branch[behavior.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[behavior.type] = functionReturningPage` and `branch[behavior.language] = javaScript-mle` or `branch[behavior.type] = functionReturningUrl` and `branch[behavior.language] = javaScript-mle`;

### execution

- `point` — `<STRING>`; —; Yes; `AFTER_PROCESSING`; `<enum:[beforeHeader:"Before Header", afterSubmit:"After Submit", validating:"Validating", processing:"Processing", afterProcessing:"After Processing"]>`; —; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### serverSideCondition

- `whenButtonPressed` — `<@button>`; —; No; —; —; lovType=COMPONENT; —;
- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[serverSideCondition.type] = rowsReturned` or `branch[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[serverSideCondition.type] = request=Value` or `branch[serverSideCondition.type] = request!=Value` or `branch[serverSideCondition.type] = requestIsContainedInValue` or `branch[serverSideCondition.type] = requestIsNotContainedInValue` or `branch[serverSideCondition.type] = currentLanguageIsContainedInValue` or `branch[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `branch[serverSideCondition.type] = currentLanguage!=value` or `branch[serverSideCondition.type] = currentLanguage=value` or `branch[serverSideCondition.type] = cgiEnvDadName=value` or `branch[serverSideCondition.type] = cgiEnvDadName!=value` or `branch[serverSideCondition.type] = cgiEnvServerName=value` or `branch[serverSideCondition.type] = cgiEnvServerName!=value` or `branch[serverSideCondition.type] = cgiEnvHttpHost=value` or `branch[serverSideCondition.type] = cgiEnvHttpHost!=value` or `branch[serverSideCondition.type] = item=value` or `branch[serverSideCondition.type] = item!=value` or `branch[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `branch[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `branch[serverSideCondition.type] = textIsContainedInValue` or `branch[serverSideCondition.type] = textIsNotContainedInValue` or `branch[serverSideCondition.type] = text=value` or `branch[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `branch[serverSideCondition.type] = item=value` or `branch[serverSideCondition.type] = item!=value` or `branch[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `branch[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `branch[serverSideCondition.type] = itemIsNull` or `branch[serverSideCondition.type] = itemIsNotNull` or `branch[serverSideCondition.type] = itemIsZero` or `branch[serverSideCondition.type] = itemIsNotZero` or `branch[serverSideCondition.type] = itemIsNullOrZero` or `branch[serverSideCondition.type] = itemIsNotNullAndNotZero` or `branch[serverSideCondition.type] = itemContainsNoSpaces` or `branch[serverSideCondition.type] = itemIsNumeric` or `branch[serverSideCondition.type] = itemIsNotNumeric` or `branch[serverSideCondition.type] = itemIsAlphanumeric` or `branch[serverSideCondition.type] = itemIsInColonDelimitedList` or `branch[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `branch[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[serverSideCondition.type] = itemIsInColonDelimitedList` or `branch[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `branch[serverSideCondition.type] = userPreference=value` or `branch[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `branch[serverSideCondition.type] = currentPage=page` or `branch[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `branch[serverSideCondition.type] = currentPageInList` or `branch[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[serverSideCondition.type] = textIsContainedInItem` or `branch[serverSideCondition.type] = textIsContainedInValue` or `branch[serverSideCondition.type] = textIsNotContainedInValue` or `branch[serverSideCondition.type] = text=value` or `branch[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `branch[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `branch[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[serverSideCondition.type] = expression` and `branch[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[serverSideCondition.type] = expression` and `branch[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[serverSideCondition.type] = expression` and `branch[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[serverSideCondition.type] = functionBody` and `branch[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `branch[serverSideCondition.type] = functionBody` and `branch[serverSideCondition.language] = javaScript-mle`;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

