# filterGroup

- componentType: `filterGroup`
- identifierRequired: true
- appliesWhen: `region[identification.type] = smartFilters`

## Properties

### listEntries

- `computeCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `showSelectedFirst` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `showCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `filterGroup[listEntries.computeCounts] = Y`;
- `zeroCountEntries` — `<STRING>`; —; Yes; `H`; `<enum:[hide:"Hide", disable:"Disable", showLast:"Show Last"]>`; —; `filterGroup[listEntries.computeCounts] = Y`;
- `sortByTopCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `filterGroup[listEntries.computeCounts] = Y` and `filterGroup[listEntries.showCounts] = Y`;

### advanced

- `combineFilters` — `<STRING>`; —; Yes; `OR`; `<enum:[or:"OR (Union)", and:"AND (Intersect)"]>`; —; —;
- `cssClasses` — `<STRING>`; Enter classes to add to this filter group. You may add multiple classes by separating them with spaces.; No; —; —; maxLength=255; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### suggestions

- `type` — `<STRING>`; —; No; —; `<enum:[dynamic:"Dynamic", staticValues:"Static Values", sqlQuery:"SQL Query"]>`; —; —;
- `staticValues` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filterGroup[suggestions.type] = staticValues`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filterGroup[suggestions.type] = sqlQuery`;
- `showLabel` — `<BOOLEAN>`; —; Yes; `N`; —; —; `filterGroup[suggestions.type] = sample`;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filterGroup[serverSideCondition.type] = rowsReturned` or `filterGroup[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filterGroup[serverSideCondition.type] = request=Value` or `filterGroup[serverSideCondition.type] = request!=Value` or `filterGroup[serverSideCondition.type] = requestIsContainedInValue` or `filterGroup[serverSideCondition.type] = requestIsNotContainedInValue` or `filterGroup[serverSideCondition.type] = currentLanguageIsContainedInValue` or `filterGroup[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `filterGroup[serverSideCondition.type] = currentLanguage!=value` or `filterGroup[serverSideCondition.type] = currentLanguage=value` or `filterGroup[serverSideCondition.type] = cgiEnvDadName=value` or `filterGroup[serverSideCondition.type] = cgiEnvDadName!=value` or `filterGroup[serverSideCondition.type] = cgiEnvServerName=value` or `filterGroup[serverSideCondition.type] = cgiEnvServerName!=value` or `filterGroup[serverSideCondition.type] = cgiEnvHttpHost=value` or `filterGroup[serverSideCondition.type] = cgiEnvHttpHost!=value` or `filterGroup[serverSideCondition.type] = item=value` or `filterGroup[serverSideCondition.type] = item!=value` or `filterGroup[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `filterGroup[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `filterGroup[serverSideCondition.type] = textIsContainedInValue` or `filterGroup[serverSideCondition.type] = textIsNotContainedInValue` or `filterGroup[serverSideCondition.type] = text=value` or `filterGroup[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `filterGroup[serverSideCondition.type] = item=value` or `filterGroup[serverSideCondition.type] = item!=value` or `filterGroup[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `filterGroup[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `filterGroup[serverSideCondition.type] = itemIsNull` or `filterGroup[serverSideCondition.type] = itemIsNotNull` or `filterGroup[serverSideCondition.type] = itemIsZero` or `filterGroup[serverSideCondition.type] = itemIsNotZero` or `filterGroup[serverSideCondition.type] = itemIsNullOrZero` or `filterGroup[serverSideCondition.type] = itemIsNotNullAndNotZero` or `filterGroup[serverSideCondition.type] = itemContainsNoSpaces` or `filterGroup[serverSideCondition.type] = itemIsNumeric` or `filterGroup[serverSideCondition.type] = itemIsNotNumeric` or `filterGroup[serverSideCondition.type] = itemIsAlphanumeric` or `filterGroup[serverSideCondition.type] = itemIsInColonDelimitedList` or `filterGroup[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `filterGroup[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filterGroup[serverSideCondition.type] = itemIsInColonDelimitedList` or `filterGroup[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `filterGroup[serverSideCondition.type] = userPreference=value` or `filterGroup[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `filterGroup[serverSideCondition.type] = currentPage=page` or `filterGroup[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `filterGroup[serverSideCondition.type] = currentPageInList` or `filterGroup[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filterGroup[serverSideCondition.type] = textIsContainedInItem` or `filterGroup[serverSideCondition.type] = textIsContainedInValue` or `filterGroup[serverSideCondition.type] = textIsNotContainedInValue` or `filterGroup[serverSideCondition.type] = text=value` or `filterGroup[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `filterGroup[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `filterGroup[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filterGroup[serverSideCondition.type] = expression` and `filterGroup[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filterGroup[serverSideCondition.type] = expression` and `filterGroup[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filterGroup[serverSideCondition.type] = expression` and `filterGroup[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filterGroup[serverSideCondition.type] = functionBody` and `filterGroup[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filterGroup[serverSideCondition.type] = functionBody` and `filterGroup[serverSideCondition.language] = javaScript-mle`;

### appearance

- `icon` — `<STRING>`; Enter the classes for the icon you want to use to identify this filter. You may add multiple classes by separating them with spaces.             If your theme uses Font APEX then review the Universal Theme Sample Application to view available icons and modifiers.; No; —; —; maxLength=255; —;

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### label (direct group)

- `label` — `<STRING>`; ~Enter the label of the filter group.~; Yes; —; —; maxLength=4000; —;

