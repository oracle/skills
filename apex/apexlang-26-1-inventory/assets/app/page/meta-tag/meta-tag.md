# metaTag

- componentType: `metaTag`
- identifierRequired: true
- appliesWhen: `page[security.authentication] = public` and `page[advanced.enableMetaTags] = Y`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; `description`; —; maxLength=255; —;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `metaTag[serverSideCondition.type] = rowsReturned` or `metaTag[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `metaTag[serverSideCondition.type] = request=Value` or `metaTag[serverSideCondition.type] = request!=Value` or `metaTag[serverSideCondition.type] = requestIsContainedInValue` or `metaTag[serverSideCondition.type] = requestIsNotContainedInValue` or `metaTag[serverSideCondition.type] = currentLanguageIsContainedInValue` or `metaTag[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `metaTag[serverSideCondition.type] = currentLanguage!=value` or `metaTag[serverSideCondition.type] = currentLanguage=value` or `metaTag[serverSideCondition.type] = cgiEnvDadName=value` or `metaTag[serverSideCondition.type] = cgiEnvDadName!=value` or `metaTag[serverSideCondition.type] = cgiEnvServerName=value` or `metaTag[serverSideCondition.type] = cgiEnvServerName!=value` or `metaTag[serverSideCondition.type] = cgiEnvHttpHost=value` or `metaTag[serverSideCondition.type] = cgiEnvHttpHost!=value` or `metaTag[serverSideCondition.type] = item=value` or `metaTag[serverSideCondition.type] = item!=value` or `metaTag[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `metaTag[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `metaTag[serverSideCondition.type] = textIsContainedInValue` or `metaTag[serverSideCondition.type] = textIsNotContainedInValue` or `metaTag[serverSideCondition.type] = text=value` or `metaTag[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `metaTag[serverSideCondition.type] = item=value` or `metaTag[serverSideCondition.type] = item!=value` or `metaTag[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `metaTag[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `metaTag[serverSideCondition.type] = itemIsNull` or `metaTag[serverSideCondition.type] = itemIsNotNull` or `metaTag[serverSideCondition.type] = itemIsZero` or `metaTag[serverSideCondition.type] = itemIsNotZero` or `metaTag[serverSideCondition.type] = itemIsNullOrZero` or `metaTag[serverSideCondition.type] = itemIsNotNullAndNotZero` or `metaTag[serverSideCondition.type] = itemContainsNoSpaces` or `metaTag[serverSideCondition.type] = itemIsNumeric` or `metaTag[serverSideCondition.type] = itemIsNotNumeric` or `metaTag[serverSideCondition.type] = itemIsAlphanumeric` or `metaTag[serverSideCondition.type] = itemIsInColonDelimitedList` or `metaTag[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `metaTag[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `metaTag[serverSideCondition.type] = itemIsInColonDelimitedList` or `metaTag[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `metaTag[serverSideCondition.type] = userPreference=value` or `metaTag[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `metaTag[serverSideCondition.type] = currentPage=page` or `metaTag[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `metaTag[serverSideCondition.type] = currentPageInList` or `metaTag[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `metaTag[serverSideCondition.type] = textIsContainedInItem` or `metaTag[serverSideCondition.type] = textIsContainedInValue` or `metaTag[serverSideCondition.type] = textIsNotContainedInValue` or `metaTag[serverSideCondition.type] = text=value` or `metaTag[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `metaTag[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `metaTag[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `metaTag[serverSideCondition.type] = expression` and `metaTag[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `metaTag[serverSideCondition.type] = expression` and `metaTag[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `metaTag[serverSideCondition.type] = expression` and `metaTag[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `metaTag[serverSideCondition.type] = functionBody` and `metaTag[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `metaTag[serverSideCondition.type] = functionBody` and `metaTag[serverSideCondition.language] = javaScript-mle`;

