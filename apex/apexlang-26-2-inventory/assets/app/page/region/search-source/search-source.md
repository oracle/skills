# searchSource

- componentType: `searchSource`
- identifierRequired: true
- appliesWhen: `region[identification.type] = search`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a descriptive name for this search source.; Yes; —; —; maxLength=255; —;
- `searchConfig` — `<@searchConfig>`; —; Yes; —; —; lovType=COMPONENT; —;
- `useAsInitialResult` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### iconAndBadge

- `iconCssClasses` — `<STRING>`; The icon or media, which is displayed with a search result, is specified in the Search Configuration, within Shared Components. This attribute allows to specify Icon CSS classes which override the Search Configuration settings.; No; —; —; maxLength=255; —;

### appearance

- `overrideLabel` — `<STRING>`; —; No; —; —; —; —;
- `maxResults` — `<INTEGER>`; —; No; —; —; —; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchSource[serverSideCondition.type] = rowsReturned` or `searchSource[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchSource[serverSideCondition.type] = request=Value` or `searchSource[serverSideCondition.type] = request!=Value` or `searchSource[serverSideCondition.type] = requestIsContainedInValue` or `searchSource[serverSideCondition.type] = requestIsNotContainedInValue` or `searchSource[serverSideCondition.type] = currentLanguageIsContainedInValue` or `searchSource[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `searchSource[serverSideCondition.type] = currentLanguage!=value` or `searchSource[serverSideCondition.type] = currentLanguage=value` or `searchSource[serverSideCondition.type] = cgiEnvDadName=value` or `searchSource[serverSideCondition.type] = cgiEnvDadName!=value` or `searchSource[serverSideCondition.type] = cgiEnvServerName=value` or `searchSource[serverSideCondition.type] = cgiEnvServerName!=value` or `searchSource[serverSideCondition.type] = cgiEnvHttpHost=value` or `searchSource[serverSideCondition.type] = cgiEnvHttpHost!=value` or `searchSource[serverSideCondition.type] = item=value` or `searchSource[serverSideCondition.type] = item!=value` or `searchSource[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `searchSource[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `searchSource[serverSideCondition.type] = textIsContainedInValue` or `searchSource[serverSideCondition.type] = textIsNotContainedInValue` or `searchSource[serverSideCondition.type] = text=value` or `searchSource[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `searchSource[serverSideCondition.type] = item=value` or `searchSource[serverSideCondition.type] = item!=value` or `searchSource[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `searchSource[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `searchSource[serverSideCondition.type] = itemIsNull` or `searchSource[serverSideCondition.type] = itemIsNotNull` or `searchSource[serverSideCondition.type] = itemIsZero` or `searchSource[serverSideCondition.type] = itemIsNotZero` or `searchSource[serverSideCondition.type] = itemIsNullOrZero` or `searchSource[serverSideCondition.type] = itemIsNotNullAndNotZero` or `searchSource[serverSideCondition.type] = itemContainsNoSpaces` or `searchSource[serverSideCondition.type] = itemIsNumeric` or `searchSource[serverSideCondition.type] = itemIsNotNumeric` or `searchSource[serverSideCondition.type] = itemIsAlphanumeric` or `searchSource[serverSideCondition.type] = itemIsInColonDelimitedList` or `searchSource[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `searchSource[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchSource[serverSideCondition.type] = itemIsInColonDelimitedList` or `searchSource[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `searchSource[serverSideCondition.type] = userPreference=value` or `searchSource[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `searchSource[serverSideCondition.type] = currentPage=page` or `searchSource[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `searchSource[serverSideCondition.type] = currentPageInList` or `searchSource[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchSource[serverSideCondition.type] = textIsContainedInItem` or `searchSource[serverSideCondition.type] = textIsContainedInValue` or `searchSource[serverSideCondition.type] = textIsNotContainedInValue` or `searchSource[serverSideCondition.type] = text=value` or `searchSource[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `searchSource[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `searchSource[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchSource[serverSideCondition.type] = expression` and `searchSource[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchSource[serverSideCondition.type] = expression` and `searchSource[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchSource[serverSideCondition.type] = expression` and `searchSource[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchSource[serverSideCondition.type] = functionBody` and `searchSource[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `searchSource[serverSideCondition.type] = functionBody` and `searchSource[serverSideCondition.language] = javaScript-mle`;

### layout

- `sequence` — `<NUMBER>`; Enter the display sequence for this search configuration. The display sequence determines the order in which search configurations are searched and results are ordered. Note: If two search configurations have the same sequence value then results might be displayed in a different order when the application is exported and imported into another environment, such as a test or production environment. To ensure consistency, Oracle recommends you specify unique sequence numbers for every search configuration, or at least for those within the same search region.; Yes; —; —; —; —;

