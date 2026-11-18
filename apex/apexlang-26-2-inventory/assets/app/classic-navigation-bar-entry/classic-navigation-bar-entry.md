# classicNavigationBarEntry

- componentType: `classicNavigationBarEntry`
- identifierRequired: true
- filePath: `shared-components/classic-navigation-bar-entries.apx`

## Properties

### icon

- `imageIconCssClasses` — `<STRING>`; The image is the name of image.&nbsp\; For example: wwv_find.gif.&nbsp\; The image prefix can be one of the following:  #WORKSPACE_IMAGES# #APP_IMAGES# null (from the directory specified by the application image attribute) ; No; —; —; maxLength=255; —;
- `height` — `<INTEGER>`; —; No; —; —; —; —;
- `width` — `<INTEGER>`; —; No; —; —; —; —;
- `altAttribute` — `<STRING>`; This text is added to the ALT tag of the image.&nbsp\; When the cursor hovers over the image the alternate text is displayed. If this Icon Bar item has no image, just text, this is where you specify that text.; No; —; —; maxLength=4000; `classicNavigationBarEntry[icon.imageIconCssClasses] = sample`;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `feedbackEntry` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### layout

- `beginsOnNewLine` — `<BOOLEAN>`; —; Yes; `NO`; —; —; —;
- `cellColumnSpan` — `<INTEGER>`; —; Yes; `1`; —; —; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### subscription

- `master` — `<@classicNavigationBarEntry>`; —; No; —; —; lovType=COMPONENT; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### link

- `target` — `<COMPLEX>`; —; Yes; —; —; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicNavigationBarEntry[serverSideCondition.type] = rowsReturned` or `classicNavigationBarEntry[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicNavigationBarEntry[serverSideCondition.type] = request=Value` or `classicNavigationBarEntry[serverSideCondition.type] = request!=Value` or `classicNavigationBarEntry[serverSideCondition.type] = requestIsContainedInValue` or `classicNavigationBarEntry[serverSideCondition.type] = requestIsNotContainedInValue` or `classicNavigationBarEntry[serverSideCondition.type] = currentLanguageIsContainedInValue` or `classicNavigationBarEntry[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `classicNavigationBarEntry[serverSideCondition.type] = currentLanguage!=value` or `classicNavigationBarEntry[serverSideCondition.type] = currentLanguage=value` or `classicNavigationBarEntry[serverSideCondition.type] = cgiEnvDadName=value` or `classicNavigationBarEntry[serverSideCondition.type] = cgiEnvDadName!=value` or `classicNavigationBarEntry[serverSideCondition.type] = cgiEnvServerName=value` or `classicNavigationBarEntry[serverSideCondition.type] = cgiEnvServerName!=value` or `classicNavigationBarEntry[serverSideCondition.type] = cgiEnvHttpHost=value` or `classicNavigationBarEntry[serverSideCondition.type] = cgiEnvHttpHost!=value` or `classicNavigationBarEntry[serverSideCondition.type] = item=value` or `classicNavigationBarEntry[serverSideCondition.type] = item!=value` or `classicNavigationBarEntry[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `classicNavigationBarEntry[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `classicNavigationBarEntry[serverSideCondition.type] = textIsContainedInValue` or `classicNavigationBarEntry[serverSideCondition.type] = textIsNotContainedInValue` or `classicNavigationBarEntry[serverSideCondition.type] = text=value` or `classicNavigationBarEntry[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `classicNavigationBarEntry[serverSideCondition.type] = item=value` or `classicNavigationBarEntry[serverSideCondition.type] = item!=value` or `classicNavigationBarEntry[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `classicNavigationBarEntry[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsNull` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsNotNull` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsZero` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsNotZero` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsNullOrZero` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsNotNullAndNotZero` or `classicNavigationBarEntry[serverSideCondition.type] = itemContainsNoSpaces` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsNumeric` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsNotNumeric` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsAlphanumeric` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsInColonDelimitedList` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `classicNavigationBarEntry[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicNavigationBarEntry[serverSideCondition.type] = itemIsInColonDelimitedList` or `classicNavigationBarEntry[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `classicNavigationBarEntry[serverSideCondition.type] = userPreference=value` or `classicNavigationBarEntry[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `classicNavigationBarEntry[serverSideCondition.type] = currentPage=page` or `classicNavigationBarEntry[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `classicNavigationBarEntry[serverSideCondition.type] = currentPageInList` or `classicNavigationBarEntry[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicNavigationBarEntry[serverSideCondition.type] = textIsContainedInItem` or `classicNavigationBarEntry[serverSideCondition.type] = textIsContainedInValue` or `classicNavigationBarEntry[serverSideCondition.type] = textIsNotContainedInValue` or `classicNavigationBarEntry[serverSideCondition.type] = text=value` or `classicNavigationBarEntry[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `classicNavigationBarEntry[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `classicNavigationBarEntry[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicNavigationBarEntry[serverSideCondition.type] = expression` and `classicNavigationBarEntry[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicNavigationBarEntry[serverSideCondition.type] = expression` and `classicNavigationBarEntry[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicNavigationBarEntry[serverSideCondition.type] = expression` and `classicNavigationBarEntry[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicNavigationBarEntry[serverSideCondition.type] = functionBody` and `classicNavigationBarEntry[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `classicNavigationBarEntry[serverSideCondition.type] = functionBody` and `classicNavigationBarEntry[serverSideCondition.language] = javaScript-mle`;

### label (direct group)

- `label` — `<STRING>`; For each navigation bar icon you can define an optional sub-text to be displayed below the icon. For example a help icon can display the text "help" below the icon.; Yes; —; —; maxLength=4000; —;

