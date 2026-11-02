# column

- componentType: `column`
- identifierRequired: true
- appliesWhen: Region COLUMNS attribute

## Properties

### identification (direct group)

- `columnName` — `<STRING>`; —; Yes; —; —; maxLength=128; —;
- `show` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### source

- `dataType` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `columnAlignment` — `<STRING>`; —; Yes; `LEFT`; `<enum:[start:"start", center:"center", end:"end"]>`; —; `column[identification.show] = Y`;

### appearance

- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; `column[source.dataType] = DATE` or `column[source.dataType] = TIMESTAMP` or `column[source.dataType] = TIMESTAMP_TZ` or `column[source.dataType] = TIMESTAMP_LTZ` or `column[source.dataType] = NUMBER`;
- `cssClasses` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.show] = Y`;

### advanced

- `customAttributes` — `<STRING>`; —; No; —; —; maxLength=2000; `column[identification.show] = Y`;

### security

- `escapeSpecialChars` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; `column[identification.show] = Y`;

### heading

- `heading` — `<STRING>`; —; No; —; —; maxLength=4000; `column[identification.show] = Y`;
- `alignment` — `<STRING>`; —; Yes; `LEFT`; `<enum:[start:"start", center:"center", end:"end"]>`; —; `column[identification.show] = Y`;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; `column[identification.show] = Y`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.show] = Y` and `column[serverSideCondition.type] = rowsReturned` or `column[identification.show] = Y` and `column[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.show] = Y` and `column[serverSideCondition.type] = request=Value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = request!=Value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = requestIsContainedInValue` or `column[identification.show] = Y` and `column[serverSideCondition.type] = requestIsNotContainedInValue` or `column[identification.show] = Y` and `column[serverSideCondition.type] = currentLanguageIsContainedInValue` or `column[identification.show] = Y` and `column[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `column[identification.show] = Y` and `column[serverSideCondition.type] = currentLanguage!=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = currentLanguage=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = cgiEnvDadName=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = cgiEnvDadName!=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = cgiEnvServerName=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = cgiEnvServerName!=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = cgiEnvHttpHost=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = cgiEnvHttpHost!=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = item=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = item!=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `column[identification.show] = Y` and `column[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `column[identification.show] = Y` and `column[serverSideCondition.type] = textIsContainedInValue` or `column[identification.show] = Y` and `column[serverSideCondition.type] = textIsNotContainedInValue` or `column[identification.show] = Y` and `column[serverSideCondition.type] = text=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `column[identification.show] = Y` and `column[serverSideCondition.type] = item=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = item!=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `column[identification.show] = Y` and `column[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsNull` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsNotNull` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsZero` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsNotZero` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsNullOrZero` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsNotNullAndNotZero` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemContainsNoSpaces` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsNumeric` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsNotNumeric` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsAlphanumeric` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsInColonDelimitedList` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `column[identification.show] = Y` and `column[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsInColonDelimitedList` or `column[identification.show] = Y` and `column[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `column[identification.show] = Y` and `column[serverSideCondition.type] = userPreference=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `column[identification.show] = Y` and `column[serverSideCondition.type] = currentPage=page` or `column[identification.show] = Y` and `column[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `column[identification.show] = Y` and `column[serverSideCondition.type] = currentPageInList` or `column[identification.show] = Y` and `column[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.show] = Y` and `column[serverSideCondition.type] = textIsContainedInItem` or `column[identification.show] = Y` and `column[serverSideCondition.type] = textIsContainedInValue` or `column[identification.show] = Y` and `column[serverSideCondition.type] = textIsNotContainedInValue` or `column[identification.show] = Y` and `column[serverSideCondition.type] = text=value` or `column[identification.show] = Y` and `column[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `column[identification.show] = Y` and `column[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `column[identification.show] = Y` and `column[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.show] = Y` and `column[serverSideCondition.type] = expression` and `column[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.show] = Y` and `column[serverSideCondition.type] = expression` and `column[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.show] = Y` and `column[serverSideCondition.type] = expression` and `column[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.show] = Y` and `column[serverSideCondition.type] = functionBody` and `column[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.show] = Y` and `column[serverSideCondition.type] = functionBody` and `column[serverSideCondition.language] = javaScript-mle`;

