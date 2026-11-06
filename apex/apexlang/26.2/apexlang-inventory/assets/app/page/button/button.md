# button

- componentType: `button`
- identifierRequired: true

## Properties

### layout

- `startNewLayout` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `column` — `<STRING>`; —; No; —; —; lovType=GRID_COLUMNS; —;
- `columnSpan` — `<STRING>`; —; No; —; —; lovType=GRID_COLUMNS; —;
- `rowSpan` — `<NUMBER>`; —; No; —; —; —; —;
- `columnAttributes` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `slot` — `<STRING>`; —; Yes; —; —; lovType=SLOTS; —;
- `columnCssClasses` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `rowCssClasses` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `region` — `<@region>`; Select the region in which the button will be displayed.; No; —; —; lovType=COMPONENT; —;
- `startNewRow` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `button[layout.startNewLayout] = N`;
- `alignment` — `<STRING>`; —; Yes; `LEFT-CENTER`; `<enum:[center:"Center", centerBottom:"Center bottom", centerCenter:"Center center", centerTop:"Center top", left:"Left", leftBottom:"Left bottom", leftCenter:"Left center", leftTop:"Left top", right:"Right", rightBottom:"Right bottom", rightCenter:"Right center", rightTop:"Right top"]>`; —; `button[layout.slot] = BODY`;
- `horizontalAlignment` — `<STRING>`; —; Yes; `RIGHT`; `<enum:[left:"Left", right:"Right"]>`; —; `button[layout.slot] = TOP` or `button[layout.slot] = TOP_AND_BOTTOM` or `button[layout.slot] = ABOVE_BOX` or `button[layout.slot] = BELOW_BOX` or `button[layout.slot] = BOTTOM`;
- `newColumn` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `button[layout.startNewLayout] = N` and `button[layout.startNewRow] = N`;

### advanced

- `customAttributes` — `<STRING>`; Enter HTML text to include for this button:    For buttons of type HTML Button, this text is added to the HTML element definition.   For buttons based on templates, your template must include the #BUTTON_ATTRIBUTES# substitution string.  You can use this attribute to control tab stops; No; —; —; maxLength=2000; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `htmlDomId` — `<STRING>`; Enter the DOM ID for the button. If defined, the DOM ID is used as the ID for the button. The DOM ID can be useful when developing custom JavaScript behavior for the button. If the DOM ID is not defined, the button generates an internal ID. Note: The template must include the #DOM_ID# substitution string, in order for the button to utilize the DOM ID entered.; No; —; —; maxLength=255; —;
- `requestSourceType` — `<STRING>`; —; No; —; `<enum:[staticValue:"Static Value", databaseColumn:"Database Column", item:"Item", sqlQuerySingleValue:"SQL Query (return single value)", sqlQueryMultipleValues:"SQL Query (return colon separated value)", plsqlExpression:"PL/SQL Expression", plsqlFunctionBody:"PL/SQL Function Body", preference:"Preference", null:"Null"]>`; —; —;
- `preText` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `postText` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `requestSource` — `<STRING>`; —; No; —; —; maxLength=4000; `button[advanced.requestSourceType] = sample`;

### identification (direct group)

- `buttonName` — `<STRING>`; Enter the name used to reference the button being clicked. When this page is submitted, the value of REQUEST is set to this button name.; Yes; —; —; maxLength=255; —;
- `label` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### appearance

- `buttonTemplate` — `<@buttonTemplate>`; —; Yes; —; `<enum:[@/icon, @/text, @/text-with-icon]>`; —; —;
- `hot` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `icon` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `cssClasses` — `<STRING>`; Enter classes to add to this component. You may add multiple classes by separating them with spaces.; No; —; —; maxLength=255; —;
- `templateOptions` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;
- `showAsDisabled` — `<BOOLEAN>`; Specify whether to render the button or menu entries as disabled instead of hiding them if the defined server-side condition evaluates to FALSE.; Yes; `N`; —; —; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### behavior

- `type` — `<STRING>`; —; Yes; `STANDARD`; `<enum:[standard:"Standard", menu:"Menu"]>`; —; —;
- `requiresConfirmation` — `<BOOLEAN>`; —; Yes; `N`; —; —; `button[behavior.type] = standard`;
- `databaseAction` — `<STRING>`; —; No; —; `<enum:[insert:"SQL INSERT action", update:"SQL UPDATE action", delete:"SQL DELETE action"]>`; —; `button[behavior.type] = standard`;
- `action` — `<STRING>`; —; Yes; `SUBMIT`; `<enum:[submitPage:"Submit Page", triggerAction:"Trigger Action", redirectThisApp:"Redirect to Page in this Application", redirectOtherApp:"Redirect to Page in a different Application", redirectUrl:"Redirect to URL", definedByDynamicAction:"Defined by Dynamic Action", resetPage:"Reset Page", nextPage:"Next Page", previousPage:"Previous Page"]>`; —; `button[behavior.type] = standard`;
- `executeValidations` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `button[behavior.type] = standard` and `button[behavior.action] = submitPage` or `button[behavior.type] = standard` and `button[behavior.action] = redirectUrl` or `button[behavior.type] = standard` and `button[behavior.action] = definedByDynamicAction` or `button[behavior.type] = standard` and `button[behavior.action] = triggerAction`;
- `showProcessing` — `<BOOLEAN>`; —; Yes; `N`; —; —; `button[behavior.type] = standard` and `button[behavior.action] = submitPage`;
- `target` — `<COMPLEX>`; Click the Target to invoke a modal dialog. You can enter the target to be called when this button is clicked. Only enter a target for buttons that should not invoke page processing when clicked (for example, a Cancel button).; Yes; —; —; —; `button[behavior.type] = standard` and `button[behavior.action] = redirectThisApp` or `button[behavior.type] = standard` and `button[behavior.action] = redirectOtherApp`;
- `targetUrl` — `<STRING>`; Enter the URL to call when this button is clicked. Only enter a target for buttons that should not invoke page processing when clicked, for example a Cancel button.; Yes; —; —; maxLength=4000; `button[behavior.type] = standard` and `button[behavior.action] = redirectUrl`;
- `warnOnUnsavedChanges` — `<STRING>`; —; No; —; `<enum:[doNotCheck:"Do Not Check"]>`; —; `button[behavior.type] = standard`;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `button[serverSideCondition.type] = rowsReturned` or `button[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `button[serverSideCondition.type] = request=Value` or `button[serverSideCondition.type] = request!=Value` or `button[serverSideCondition.type] = requestIsContainedInValue` or `button[serverSideCondition.type] = requestIsNotContainedInValue` or `button[serverSideCondition.type] = currentLanguageIsContainedInValue` or `button[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `button[serverSideCondition.type] = currentLanguage!=value` or `button[serverSideCondition.type] = currentLanguage=value` or `button[serverSideCondition.type] = cgiEnvDadName=value` or `button[serverSideCondition.type] = cgiEnvDadName!=value` or `button[serverSideCondition.type] = cgiEnvServerName=value` or `button[serverSideCondition.type] = cgiEnvServerName!=value` or `button[serverSideCondition.type] = cgiEnvHttpHost=value` or `button[serverSideCondition.type] = cgiEnvHttpHost!=value` or `button[serverSideCondition.type] = item=value` or `button[serverSideCondition.type] = item!=value` or `button[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `button[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `button[serverSideCondition.type] = textIsContainedInValue` or `button[serverSideCondition.type] = textIsNotContainedInValue` or `button[serverSideCondition.type] = text=value` or `button[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `button[serverSideCondition.type] = item=value` or `button[serverSideCondition.type] = item!=value` or `button[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `button[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `button[serverSideCondition.type] = itemIsNull` or `button[serverSideCondition.type] = itemIsNotNull` or `button[serverSideCondition.type] = itemIsZero` or `button[serverSideCondition.type] = itemIsNotZero` or `button[serverSideCondition.type] = itemIsNullOrZero` or `button[serverSideCondition.type] = itemIsNotNullAndNotZero` or `button[serverSideCondition.type] = itemContainsNoSpaces` or `button[serverSideCondition.type] = itemIsNumeric` or `button[serverSideCondition.type] = itemIsNotNumeric` or `button[serverSideCondition.type] = itemIsAlphanumeric` or `button[serverSideCondition.type] = itemIsInColonDelimitedList` or `button[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `button[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `button[serverSideCondition.type] = itemIsInColonDelimitedList` or `button[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `button[serverSideCondition.type] = userPreference=value` or `button[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `button[serverSideCondition.type] = currentPage=page` or `button[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `button[serverSideCondition.type] = currentPageInList` or `button[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `button[serverSideCondition.type] = textIsContainedInItem` or `button[serverSideCondition.type] = textIsContainedInValue` or `button[serverSideCondition.type] = textIsNotContainedInValue` or `button[serverSideCondition.type] = text=value` or `button[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `button[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `button[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `button[serverSideCondition.type] = expression` and `button[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `button[serverSideCondition.type] = expression` and `button[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `button[serverSideCondition.type] = expression` and `button[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `button[serverSideCondition.type] = functionBody` and `button[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `button[serverSideCondition.type] = functionBody` and `button[serverSideCondition.language] = javaScript-mle`;

### confirmation

- `message` — `<STRING>`; —; Yes; —; —; maxLength=4000; `button[behavior.type] = standard` and `button[behavior.requiresConfirmation] = Y`;
- `style` — `<STRING>`; —; No; —; `<enum:[information:"Information", warning:"Warning", danger:"Danger", success:"Success"]>`; —; `button[behavior.type] = standard` and `button[behavior.requiresConfirmation] = Y`;

