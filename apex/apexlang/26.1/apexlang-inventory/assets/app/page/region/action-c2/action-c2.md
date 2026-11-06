# action

- componentType: `action`
- identifierRequired: true

## Properties

### advanced

- `staticId` — `<STRING>`; —; Yes; `action`; —; maxLength=255; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### identification (direct group)

- `position` — `<STRING>`; —; Yes; —; —; lovType=PLUGIN_ACTION_POSITIONS; —;
- `template` — `<STRING>`; —; Yes; —; —; lovType=PLUGIN_ACTION_TEMPLATES; —;
- `label` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `executeCondition` — `<STRING>`; —; Yes; `Y`; `<enum:[forEachRow:"For Each Row", once:"Once"]>`; —; `action[serverSideCondition.type] = sample`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = rowsReturned` or `action[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = request=Value` or `action[serverSideCondition.type] = request!=Value` or `action[serverSideCondition.type] = requestIsContainedInValue` or `action[serverSideCondition.type] = requestIsNotContainedInValue` or `action[serverSideCondition.type] = currentLanguageIsContainedInValue` or `action[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `action[serverSideCondition.type] = currentLanguage!=value` or `action[serverSideCondition.type] = currentLanguage=value` or `action[serverSideCondition.type] = cgiEnvDadName=value` or `action[serverSideCondition.type] = cgiEnvDadName!=value` or `action[serverSideCondition.type] = cgiEnvServerName=value` or `action[serverSideCondition.type] = cgiEnvServerName!=value` or `action[serverSideCondition.type] = cgiEnvHttpHost=value` or `action[serverSideCondition.type] = cgiEnvHttpHost!=value` or `action[serverSideCondition.type] = item=value` or `action[serverSideCondition.type] = item!=value` or `action[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `action[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `action[serverSideCondition.type] = textIsContainedInValue` or `action[serverSideCondition.type] = textIsNotContainedInValue` or `action[serverSideCondition.type] = text=value` or `action[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `action[serverSideCondition.type] = item=value` or `action[serverSideCondition.type] = item!=value` or `action[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `action[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `action[serverSideCondition.type] = itemIsNull` or `action[serverSideCondition.type] = itemIsNotNull` or `action[serverSideCondition.type] = itemIsZero` or `action[serverSideCondition.type] = itemIsNotZero` or `action[serverSideCondition.type] = itemIsNullOrZero` or `action[serverSideCondition.type] = itemIsNotNullAndNotZero` or `action[serverSideCondition.type] = itemContainsNoSpaces` or `action[serverSideCondition.type] = itemIsNumeric` or `action[serverSideCondition.type] = itemIsNotNumeric` or `action[serverSideCondition.type] = itemIsAlphanumeric` or `action[serverSideCondition.type] = itemIsInColonDelimitedList` or `action[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `action[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = itemIsInColonDelimitedList` or `action[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `action[serverSideCondition.type] = userPreference=value` or `action[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `action[serverSideCondition.type] = currentPage=page` or `action[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `action[serverSideCondition.type] = currentPageInList` or `action[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = textIsContainedInItem` or `action[serverSideCondition.type] = textIsContainedInValue` or `action[serverSideCondition.type] = textIsNotContainedInValue` or `action[serverSideCondition.type] = text=value` or `action[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `action[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `action[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = expression` and `action[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = expression` and `action[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = expression` and `action[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = functionBody` and `action[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = functionBody` and `action[serverSideCondition.language] = javaScript-mle`;

### layout

- `sequence` — `<NUMBER>`; Enter the display sequence for this action. This is used to evaluate the display condition and render in the order defined.; Yes; —; —; —; —;

### behavior

- `type` — `<STRING>`; —; Yes; `REDIRECT_PAGE`; `<enum:[redirectThisApp:"Redirect to Page in this Application", redirectOtherApp:"Redirect to Page in a different Application", redirectUrl:"Redirect to URL", triggerAction:"Trigger Action"]>`; —; —;
- `linkAttributes` — `<STRING>`; —; No; —; —; maxLength=4000; `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectOtherApp` or `action[behavior.type] = redirectOtherApp` or `action[behavior.type] = redirectOtherApp` or `action[behavior.type] = redirectUrl` or `action[behavior.type] = redirectUrl` or `action[behavior.type] = redirectUrl` or `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectOtherApp` or `action[behavior.type] = redirectOtherApp` or `action[behavior.type] = redirectOtherApp` or `action[behavior.type] = redirectUrl` or `action[behavior.type] = redirectUrl` or `action[behavior.type] = redirectUrl` or `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectOtherApp` or `action[behavior.type] = redirectOtherApp` or `action[behavior.type] = redirectOtherApp` or `action[behavior.type] = redirectUrl` or `action[behavior.type] = redirectUrl` or `action[behavior.type] = redirectUrl`;
- `target` — `<COMPLEX>`; —; Yes; —; —; —; `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectThisApp` or `action[behavior.type] = redirectOtherApp` or `action[behavior.type] = redirectOtherApp` or `action[behavior.type] = redirectOtherApp`;
- `targetUrl` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[behavior.type] = redirectUrl` or `action[behavior.type] = redirectUrl` or `action[behavior.type] = redirectUrl`;

### appearance

- `displayType` — `<STRING>`; —; Yes; `TEXT`; `<enum:[text:"Text", icon:"Icon", textWithIcon:"Text with Icon"]>`; —; —;
- `hot` — `<BOOLEAN>`; Specify whether to use the Normal or Hot button when rendering this button.; Yes; `N`; —; —; —;
- `showAsDisabled` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `cssClasses` — `<STRING>`; Enter classes to add to this action. You may add multiple classes by separating them with spaces.; No; —; —; maxLength=255; —;
- `icon` — `<STRING>`; —; Yes; —; —; maxLength=255; `action[appearance.displayType] = icon` or `action[appearance.displayType] = textWithIcon` or `action[appearance.displayType] = icon` or `action[appearance.displayType] = textWithIcon`;

