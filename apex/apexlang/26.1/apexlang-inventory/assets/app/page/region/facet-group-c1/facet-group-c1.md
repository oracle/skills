# facetGroup

- componentType: `facetGroup`
- identifierRequired: true
- appliesWhen: `region[identification.type] = facetedSearch`

## Properties

### listEntries

- `computeCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `showSelectedFirst` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `maxDisplayedEntries` — `<INTEGER>`; —; No; —; —; —; —;
- `showCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `facetGroup[listEntries.computeCounts] = Y`;
- `zeroCountEntries` — `<STRING>`; —; Yes; `H`; `<enum:[hide:"Hide", disable:"Disable", showLast:"Show Last"]>`; —; `facetGroup[listEntries.computeCounts] = Y`;
- `sortByTopCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `facetGroup[listEntries.computeCounts] = Y` and `facetGroup[listEntries.showCounts] = Y`;

### layout

- `maxHeight` — `<INTEGER>`; —; No; —; —; —; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### advanced

- `combineFilters` — `<STRING>`; —; Yes; `OR`; `<enum:[or:"OR (Union)", and:"AND (Intersect)"]>`; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `collapsible` — `<BOOLEAN>`; —; Yes; `N`; —; —; `facetGroup[appearance.display] = inline`;
- `cssClasses` — `<STRING>`; Enter classes to add to this facet group. You may add multiple classes by separating them with spaces.; No; —; —; maxLength=255; `facetGroup[appearance.display] = inline`;
- `initiallyCollapsed` — `<BOOLEAN>`; —; Yes; `N`; —; —; `facetGroup[appearance.display] = inline` and `facetGroup[advanced.collapsible] = Y`;
- `showChartInitially` — `<BOOLEAN>`; —; Yes; `N`; —; —; `facetGroup[listEntries.computeCounts] = Y` and `facetGroup[appearance.display] = inline` and `facetGroup[actionsMenu.chart] = Y` and `facetGroup[appearance.display] = inline`;

### appearance

- `display` — `<STRING>`; —; Yes; `INLINE`; `<enum:[inline:"Inline", addFilterDialog:"Add Filter Dialog"]>`; —; —;
- `icon` — `<STRING>`; Enter the classes for the icon you want to use to identify this facet. You may add multiple classes by separating them with spaces.             If your theme uses Font APEX then review the Universal Theme Sample Application to view available icons and modifiers.; No; —; —; maxLength=255; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facetGroup[serverSideCondition.type] = rowsReturned` or `facetGroup[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facetGroup[serverSideCondition.type] = request=Value` or `facetGroup[serverSideCondition.type] = request!=Value` or `facetGroup[serverSideCondition.type] = requestIsContainedInValue` or `facetGroup[serverSideCondition.type] = requestIsNotContainedInValue` or `facetGroup[serverSideCondition.type] = currentLanguageIsContainedInValue` or `facetGroup[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `facetGroup[serverSideCondition.type] = currentLanguage!=value` or `facetGroup[serverSideCondition.type] = currentLanguage=value` or `facetGroup[serverSideCondition.type] = cgiEnvDadName=value` or `facetGroup[serverSideCondition.type] = cgiEnvDadName!=value` or `facetGroup[serverSideCondition.type] = cgiEnvServerName=value` or `facetGroup[serverSideCondition.type] = cgiEnvServerName!=value` or `facetGroup[serverSideCondition.type] = cgiEnvHttpHost=value` or `facetGroup[serverSideCondition.type] = cgiEnvHttpHost!=value` or `facetGroup[serverSideCondition.type] = item=value` or `facetGroup[serverSideCondition.type] = item!=value` or `facetGroup[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `facetGroup[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `facetGroup[serverSideCondition.type] = textIsContainedInValue` or `facetGroup[serverSideCondition.type] = textIsNotContainedInValue` or `facetGroup[serverSideCondition.type] = text=value` or `facetGroup[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `facetGroup[serverSideCondition.type] = item=value` or `facetGroup[serverSideCondition.type] = item!=value` or `facetGroup[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `facetGroup[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `facetGroup[serverSideCondition.type] = itemIsNull` or `facetGroup[serverSideCondition.type] = itemIsNotNull` or `facetGroup[serverSideCondition.type] = itemIsZero` or `facetGroup[serverSideCondition.type] = itemIsNotZero` or `facetGroup[serverSideCondition.type] = itemIsNullOrZero` or `facetGroup[serverSideCondition.type] = itemIsNotNullAndNotZero` or `facetGroup[serverSideCondition.type] = itemContainsNoSpaces` or `facetGroup[serverSideCondition.type] = itemIsNumeric` or `facetGroup[serverSideCondition.type] = itemIsNotNumeric` or `facetGroup[serverSideCondition.type] = itemIsAlphanumeric` or `facetGroup[serverSideCondition.type] = itemIsInColonDelimitedList` or `facetGroup[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `facetGroup[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facetGroup[serverSideCondition.type] = itemIsInColonDelimitedList` or `facetGroup[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `facetGroup[serverSideCondition.type] = userPreference=value` or `facetGroup[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `facetGroup[serverSideCondition.type] = currentPage=page` or `facetGroup[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `facetGroup[serverSideCondition.type] = currentPageInList` or `facetGroup[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facetGroup[serverSideCondition.type] = textIsContainedInItem` or `facetGroup[serverSideCondition.type] = textIsContainedInValue` or `facetGroup[serverSideCondition.type] = textIsNotContainedInValue` or `facetGroup[serverSideCondition.type] = text=value` or `facetGroup[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `facetGroup[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `facetGroup[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facetGroup[serverSideCondition.type] = expression` and `facetGroup[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facetGroup[serverSideCondition.type] = expression` and `facetGroup[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facetGroup[serverSideCondition.type] = expression` and `facetGroup[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facetGroup[serverSideCondition.type] = functionBody` and `facetGroup[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facetGroup[serverSideCondition.type] = functionBody` and `facetGroup[serverSideCondition.language] = javaScript-mle`;

### label (direct group)

- `label` — `<STRING>`; ~Enter the label of the facet group.~; Yes; —; —; maxLength=4000; —;

### actionsMenu

- `chart` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `facetGroup[listEntries.computeCounts] = Y` and `facetGroup[appearance.display] = inline`;

