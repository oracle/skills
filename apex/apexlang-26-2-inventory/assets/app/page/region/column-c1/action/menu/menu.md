# menu

- componentType: `menu`
- identifierRequired: true
- appliesWhen: `region[identification.type] = interactiveReport`

## Properties

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### identification (direct group)

- `type` — `<STRING>`; —; Yes; `ENTRY`; `<enum:[menuEntry:"Menu Entry", subMenu:"Sub-Menu", separator:"Separator"]>`; —; —;
- `parentMenu` — `<@menu>`; —; No; —; —; lovType=COMPONENT; —;
- `label` — `<STRING>`; Enter the text to be displayed in the menu.; Yes; —; —; maxLength=255; `menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### layout

- `sequence` — `<NUMBER>`; Enter the display sequence for this menu entry. This is used to evaluate the display condition and render in the order defined.; Yes; —; —; —; —;

### behavior

- `type` — `<STRING>`; —; Yes; `REDIRECT_PAGE`; `<enum:[redirectThisApp:"Redirect to Page in this Application", redirectOtherApp:"Redirect to Page in a different Application", redirectUrl:"Redirect to URL", triggerAction:"Trigger Action"]>`; —; `menu[identification.type] = menuEntry`;
- `linkAttributes` — `<STRING>`; —; No; —; —; maxLength=4000; `menu[identification.type] = menuEntry` and (`menu[behavior.type] = redirectThisApp` or `menu[behavior.type] = redirectOtherApp` or `menu[behavior.type] = redirectUrl`);
- `target` — `<COMPLEX>`; —; Yes; —; —; —; `menu[identification.type] = menuEntry` and (`menu[behavior.type] = redirectThisApp` or `menu[behavior.type] = redirectOtherApp`);
- `targetUrl` — `<STRING>`; —; Yes; —; —; maxLength=4000; `menu[identification.type] = menuEntry` and `menu[behavior.type] = redirectUrl`;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; `menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; `menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`;
- `executeCondition` — `<STRING>`; —; Yes; `Y`; `<enum:[forEachRow:"For Each Row", once:"Once"]>`; —; `menu[serverSideCondition.type] = sample` and (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`);
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`) and (`menu[serverSideCondition.type] = rowsReturned` or `menu[serverSideCondition.type] = noRowsReturned`);
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`) and (`menu[serverSideCondition.type] = request=Value` or `menu[serverSideCondition.type] = request!=Value` or `menu[serverSideCondition.type] = requestIsContainedInValue` or `menu[serverSideCondition.type] = requestIsNotContainedInValue` or `menu[serverSideCondition.type] = currentLanguageIsContainedInValue` or `menu[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `menu[serverSideCondition.type] = currentLanguage!=value` or `menu[serverSideCondition.type] = currentLanguage=value` or `menu[serverSideCondition.type] = cgiEnvDadName=value` or `menu[serverSideCondition.type] = cgiEnvDadName!=value` or `menu[serverSideCondition.type] = cgiEnvServerName=value` or `menu[serverSideCondition.type] = cgiEnvServerName!=value` or `menu[serverSideCondition.type] = cgiEnvHttpHost=value` or `menu[serverSideCondition.type] = cgiEnvHttpHost!=value` or `menu[serverSideCondition.type] = item=value` or `menu[serverSideCondition.type] = item!=value` or `menu[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `menu[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `menu[serverSideCondition.type] = textIsContainedInValue` or `menu[serverSideCondition.type] = textIsNotContainedInValue` or `menu[serverSideCondition.type] = text=value` or `menu[serverSideCondition.type] = text!=value`);
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`) and (`menu[serverSideCondition.type] = item=value` or `menu[serverSideCondition.type] = item!=value` or `menu[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `menu[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `menu[serverSideCondition.type] = itemIsNull` or `menu[serverSideCondition.type] = itemIsNotNull` or `menu[serverSideCondition.type] = itemIsZero` or `menu[serverSideCondition.type] = itemIsNotZero` or `menu[serverSideCondition.type] = itemIsNullOrZero` or `menu[serverSideCondition.type] = itemIsNotNullAndNotZero` or `menu[serverSideCondition.type] = itemContainsNoSpaces` or `menu[serverSideCondition.type] = itemIsNumeric` or `menu[serverSideCondition.type] = itemIsNotNumeric` or `menu[serverSideCondition.type] = itemIsAlphanumeric` or `menu[serverSideCondition.type] = itemIsInColonDelimitedList` or `menu[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `menu[serverSideCondition.type] = textIsContainedInItem`);
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`) and (`menu[serverSideCondition.type] = itemIsInColonDelimitedList` or `menu[serverSideCondition.type] = itemIsNotInColonDelimitedList`);
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`) and (`menu[serverSideCondition.type] = userPreference=value` or `menu[serverSideCondition.type] = userPreference!=value`);
- `page` — `<INTEGER>`; —; Yes; —; —; —; (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`) and (`menu[serverSideCondition.type] = currentPage=page` or `menu[serverSideCondition.type] = currentPage!=page`);
- `pages` — `<INTEGER>`; —; Yes; —; —; —; (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`) and (`menu[serverSideCondition.type] = currentPageInList` or `menu[serverSideCondition.type] = currentPageNotInList`);
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`) and (`menu[serverSideCondition.type] = textIsContainedInItem` or `menu[serverSideCondition.type] = textIsContainedInValue` or `menu[serverSideCondition.type] = textIsNotContainedInValue` or `menu[serverSideCondition.type] = text=value` or `menu[serverSideCondition.type] = text!=value`);
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `menu[serverSideCondition.type] = expression` and (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`);
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `menu[serverSideCondition.type] = functionBody` and (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`);
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `menu[serverSideCondition.type] = expression` and `menu[serverSideCondition.language] = sql` and (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`);
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `menu[serverSideCondition.type] = expression` and `menu[serverSideCondition.language] = plsql` and (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`);
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `menu[serverSideCondition.type] = expression` and `menu[serverSideCondition.language] = javaScript-mle` and (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`);
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `menu[serverSideCondition.type] = functionBody` and `menu[serverSideCondition.language] = plsql` and (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`);
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `menu[serverSideCondition.type] = functionBody` and `menu[serverSideCondition.language] = javaScript-mle` and (`menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`);

### appearance

- `icon` — `<STRING>`; —; No; —; —; maxLength=255; `menu[identification.type] = menuEntry` or `menu[identification.type] = subMenu`;

