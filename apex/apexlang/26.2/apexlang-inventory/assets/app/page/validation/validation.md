# validation

- componentType: `validation`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter the name for the validation. This name should be descriptive so that developers can easily identify conditions being checked.; Yes; —; —; maxLength=255; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### serverSideCondition

- `whenButtonPressed` — `<@button>`; —; No; —; —; lovType=COMPONENT; —;
- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `executionScope` — `<STRING>`; —; Yes; `Y`; `<enum:[forCreatedAndModifiedRows:"For Created and Modified Rows", allSubmittedRows:"All Submitted Rows"]>`; —; `validation[validation.editableRegion] = sample`;
- `executeCondition` — `<STRING>`; —; Yes; `Y`; `<enum:[forEachRow:"For Each Row", once:"Once"]>`; —; `validation[validation.editableRegion] = sample` and `validation[serverSideCondition.type] = sample`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = rowsReturned` or `validation[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = request=Value` or `validation[serverSideCondition.type] = request!=Value` or `validation[serverSideCondition.type] = requestIsContainedInValue` or `validation[serverSideCondition.type] = requestIsNotContainedInValue` or `validation[serverSideCondition.type] = currentLanguageIsContainedInValue` or `validation[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `validation[serverSideCondition.type] = currentLanguage!=value` or `validation[serverSideCondition.type] = currentLanguage=value` or `validation[serverSideCondition.type] = cgiEnvDadName=value` or `validation[serverSideCondition.type] = cgiEnvDadName!=value` or `validation[serverSideCondition.type] = cgiEnvServerName=value` or `validation[serverSideCondition.type] = cgiEnvServerName!=value` or `validation[serverSideCondition.type] = cgiEnvHttpHost=value` or `validation[serverSideCondition.type] = cgiEnvHttpHost!=value` or `validation[serverSideCondition.type] = item=value` or `validation[serverSideCondition.type] = item!=value` or `validation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `validation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `validation[serverSideCondition.type] = textIsContainedInValue` or `validation[serverSideCondition.type] = textIsNotContainedInValue` or `validation[serverSideCondition.type] = text=value` or `validation[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `validation[serverSideCondition.type] = item=value` or `validation[serverSideCondition.type] = item!=value` or `validation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `validation[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `validation[serverSideCondition.type] = itemIsNull` or `validation[serverSideCondition.type] = itemIsNotNull` or `validation[serverSideCondition.type] = itemIsZero` or `validation[serverSideCondition.type] = itemIsNotZero` or `validation[serverSideCondition.type] = itemIsNullOrZero` or `validation[serverSideCondition.type] = itemIsNotNullAndNotZero` or `validation[serverSideCondition.type] = itemContainsNoSpaces` or `validation[serverSideCondition.type] = itemIsNumeric` or `validation[serverSideCondition.type] = itemIsNotNumeric` or `validation[serverSideCondition.type] = itemIsAlphanumeric` or `validation[serverSideCondition.type] = itemIsInColonDelimitedList` or `validation[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `validation[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = itemIsInColonDelimitedList` or `validation[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `validation[serverSideCondition.type] = userPreference=value` or `validation[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `validation[serverSideCondition.type] = currentPage=page` or `validation[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `validation[serverSideCondition.type] = currentPageInList` or `validation[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = textIsContainedInItem` or `validation[serverSideCondition.type] = textIsContainedInValue` or `validation[serverSideCondition.type] = textIsNotContainedInValue` or `validation[serverSideCondition.type] = text=value` or `validation[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `validation[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `validation[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = expression` and `validation[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = expression` and `validation[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = expression` and `validation[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = functionBody` and `validation[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[serverSideCondition.type] = functionBody` and `validation[serverSideCondition.language] = javaScript-mle`;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### validation

- `alwaysExecute` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `editableRegion` — `<@region>`; —; No; —; —; lovType=COMPONENT; —;
- `type` — `<STRING>`; —; Yes; `EXPRESSION`; `<enum:[rowsReturned, noRowsReturned, expression, plsqlError, functionBodyReturningBoolean, functionBody, itemIsNotNull, itemIsNotNullOrZero, itemIsNotZero, itemContainsNoSpaces, itemIsAlphanumeric, itemIsNumeric, itemIsAValidDate, itemIsAValidTimestamp, item=Value, item!=Value, itemIsContainedInValue, itemIsNotContainedInValue, itemContainsOnlyCharsInValue, itemContainsAtLeastOneOfCharsInValue, itemContainsNoneOfCharsInValue, itemMatchesRegexp]>`; —; —;
- `type` — `<STRING>`; —; Yes; `EXPRESSION`; `<enum:[rowsReturned, noRowsReturned, expression, plsqlError, functionBodyReturningBoolean, functionBody, columnIsNotNull, columnIsNotNullOrZero, columnIsNotZero, columnContainsNoSpaces, columnIsAlphanumeric, columnIsNumeric, columnIsAValidDate, columnIsAValidTimestamp, column=Value, column!=Value, columnIsContainedInValue, columnIsNotContainedInValue, columnContainsOnlyCharsInValue, columnContainsAtLeastOneOfCharsInValue, columnContainsNoneOfCharsInValue, columnMatchesRegexp]>`; —; `validation[validation.editableRegion] = sample`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = rowsReturned` or `validation[validation.type] = noRowsReturned` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = rowsReturned` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = noRowsReturned`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; —;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = item=Value` or `validation[validation.type] = item!=Value` or `validation[validation.type] = itemIsContainedInValue` or `validation[validation.type] = itemIsNotContainedInValue` or `validation[validation.type] = itemContainsAtLeastOneOfCharsInValue` or `validation[validation.type] = itemContainsOnlyCharsInValue` or `validation[validation.type] = itemContainsNoneOfCharsInValue` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = column=Value` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = column!=Value` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = columnIsContainedInValue` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = columnIsNotContainedInValue` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = columnContainsAtLeastOneOfCharsInValue` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = columnContainsOnlyCharsInValue` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = columnContainsNoneOfCharsInValue`;
- `regexp` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = itemMatchesRegexp` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = columnMatchesRegexp`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `validation[validation.type] = functionBody` or `validation[validation.type] = functionBodyReturningBoolean` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = functionBody` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = functionBodyReturningBoolean`;
- `plsqlCodeRaisingError` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = plsqlError` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = plsqlError`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `validation[validation.type] = expression` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = expression`;
- `column` — `<STRING>`; —; Yes; —; —; maxLength=128; `validation[validation.editableRegion] = sample`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = functionBody` and `validation[validation.language] = plsql` or `validation[validation.type] = functionBodyReturningBoolean` and `validation[validation.language] = plsql` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = functionBody` and `validation[validation.language] = plsql` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = functionBodyReturningBoolean` and `validation[validation.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = functionBody` and `validation[validation.language] = javaScript-mle` or `validation[validation.type] = functionBodyReturningBoolean` and `validation[validation.language] = javaScript-mle` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = functionBody` and `validation[validation.language] = javaScript-mle` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = functionBodyReturningBoolean` and `validation[validation.language] = javaScript-mle`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = expression` and `validation[validation.language] = sql` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = expression` and `validation[validation.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = expression` and `validation[validation.language] = plsql` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = expression` and `validation[validation.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.type] = expression` and `validation[validation.language] = javaScript-mle` or `validation[validation.editableRegion] = sample` and `validation[validation.type] = expression` and `validation[validation.language] = javaScript-mle`;

### error

- `displayLocation` — `<STRING>`; —; Yes; `INLINE_WITH_FIELD_AND_NOTIFICATION`; `<enum:[inlineWithFieldAndInNotification:"Inline with Field and in Notification", inlineWithField:"Inline with Field", inlineInNotification:"Inline in Notification", onErrorPage:"On Error Page"]>`; —; —;
- `associatedItem` — `<@pageItem>`; —; No; —; —; lovType=COMPONENT; —;
- `associatedColumn` — `<STRING>`; —; No; —; —; maxLength=255; `validation[validation.editableRegion] = sample`;
- `errorMessage` — `<STRING>`; —; Yes; —; —; maxLength=4000; `validation[validation.editableRegion] = sample`;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### execution

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

