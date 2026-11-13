# entry

- componentType: `entry`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Identify the short name of this breadcrumb entry. Both the short and long names can be referenced from the breadcrumb template.; Yes; —; —; maxLength=255; —;
- `pageNumber` — `<INTEGER>`; —; Yes; —; —; —; —;

### appearance

- `parentEntry` — `<@entry>`; —; No; —; —; lovType=COMPONENT; —;
- `longName` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### link

- `target` — `<COMPLEX>`; —; No; —; —; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `entry[serverSideCondition.type] = rowsReturned` or `entry[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `entry[serverSideCondition.type] = request=Value` or `entry[serverSideCondition.type] = request!=Value` or `entry[serverSideCondition.type] = requestIsContainedInValue` or `entry[serverSideCondition.type] = requestIsNotContainedInValue` or `entry[serverSideCondition.type] = currentLanguageIsContainedInValue` or `entry[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `entry[serverSideCondition.type] = currentLanguage!=value` or `entry[serverSideCondition.type] = currentLanguage=value` or `entry[serverSideCondition.type] = cgiEnvDadName=value` or `entry[serverSideCondition.type] = cgiEnvDadName!=value` or `entry[serverSideCondition.type] = cgiEnvServerName=value` or `entry[serverSideCondition.type] = cgiEnvServerName!=value` or `entry[serverSideCondition.type] = cgiEnvHttpHost=value` or `entry[serverSideCondition.type] = cgiEnvHttpHost!=value` or `entry[serverSideCondition.type] = item=value` or `entry[serverSideCondition.type] = item!=value` or `entry[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `entry[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `entry[serverSideCondition.type] = textIsContainedInValue` or `entry[serverSideCondition.type] = textIsNotContainedInValue` or `entry[serverSideCondition.type] = text=value` or `entry[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `entry[serverSideCondition.type] = item=value` or `entry[serverSideCondition.type] = item!=value` or `entry[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `entry[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `entry[serverSideCondition.type] = itemIsNull` or `entry[serverSideCondition.type] = itemIsNotNull` or `entry[serverSideCondition.type] = itemIsZero` or `entry[serverSideCondition.type] = itemIsNotZero` or `entry[serverSideCondition.type] = itemIsNullOrZero` or `entry[serverSideCondition.type] = itemIsNotNullAndNotZero` or `entry[serverSideCondition.type] = itemContainsNoSpaces` or `entry[serverSideCondition.type] = itemIsNumeric` or `entry[serverSideCondition.type] = itemIsNotNumeric` or `entry[serverSideCondition.type] = itemIsAlphanumeric` or `entry[serverSideCondition.type] = itemIsInColonDelimitedList` or `entry[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `entry[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `entry[serverSideCondition.type] = itemIsInColonDelimitedList` or `entry[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `entry[serverSideCondition.type] = userPreference=value` or `entry[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `entry[serverSideCondition.type] = currentPage=page` or `entry[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `entry[serverSideCondition.type] = currentPageInList` or `entry[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `entry[serverSideCondition.type] = textIsContainedInItem` or `entry[serverSideCondition.type] = textIsContainedInValue` or `entry[serverSideCondition.type] = textIsNotContainedInValue` or `entry[serverSideCondition.type] = text=value` or `entry[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `entry[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `entry[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `entry[serverSideCondition.type] = expression` and `entry[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `entry[serverSideCondition.type] = expression` and `entry[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `entry[serverSideCondition.type] = expression` and `entry[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `entry[serverSideCondition.type] = functionBody` and `entry[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `entry[serverSideCondition.type] = functionBody` and `entry[serverSideCondition.language] = javaScript-mle`;

### execution

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

