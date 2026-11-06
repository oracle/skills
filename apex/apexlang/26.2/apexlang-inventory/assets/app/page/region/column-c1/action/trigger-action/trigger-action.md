# triggerAction

- componentType: `triggerAction`
- identifierRequired: true
- appliesWhen: `action[behavior.type] = triggerAction` and `region[identification.type] = interactiveReport` or `action[behavior.type] = triggerAction` and `region[identification.type] = interactiveReport` or `action[behavior.type] = triggerAction` and `region[identification.type] = interactiveReport`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter the name of the action. This helps to identify what the action does in Page Designer.; No; —; —; maxLength=255; —;
- `action` — `<STRING>`; —; Yes; —; `<enum:[addClass, addClass, alert, alert, cancelDialog, cancelDialog, cancelEvent, cancelEvent, clear, clear, clearErrors, clearErrors, closeDialog, closeDialog, closeRegion, closeRegion, collapseTree, collapseTree, confirm, confirm, disable, disable, download, download, enable, enable, executeJsCode, executeJsCode, executeServerSideCode, executeServerSideCode, expandTree, expandTree, generateTextWithAi, generateTextWithAi, getCurrentPosition, getCurrentPosition, hide, hide, invokeInteractiveReportDialog, invokeInteractiveReportDialog, openRegion, openRegion, printReport, printReport, refresh, refresh, removeClass, removeClass, setFocus, setFocus, setStyle, setStyle, setValue, setValue, share, share, show, show, showAiAssistant, showAiAssistant, showErrorMessage, showErrorMessage, showSuccessMessage, showSuccessMessage, submitPage, submitPage, triggerGeocoding, triggerGeocoding]>`; —; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `initJavaScriptFunction` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; Select a condition type to be met in order for this action to be active.; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[serverSideCondition.type] = rowsReturned` or `triggerAction[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[serverSideCondition.type] = request=Value` or `triggerAction[serverSideCondition.type] = request!=Value` or `triggerAction[serverSideCondition.type] = requestIsContainedInValue` or `triggerAction[serverSideCondition.type] = requestIsNotContainedInValue` or `triggerAction[serverSideCondition.type] = currentLanguageIsContainedInValue` or `triggerAction[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `triggerAction[serverSideCondition.type] = currentLanguage!=value` or `triggerAction[serverSideCondition.type] = currentLanguage=value` or `triggerAction[serverSideCondition.type] = cgiEnvDadName=value` or `triggerAction[serverSideCondition.type] = cgiEnvDadName!=value` or `triggerAction[serverSideCondition.type] = cgiEnvServerName=value` or `triggerAction[serverSideCondition.type] = cgiEnvServerName!=value` or `triggerAction[serverSideCondition.type] = cgiEnvHttpHost=value` or `triggerAction[serverSideCondition.type] = cgiEnvHttpHost!=value` or `triggerAction[serverSideCondition.type] = item=value` or `triggerAction[serverSideCondition.type] = item!=value` or `triggerAction[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `triggerAction[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `triggerAction[serverSideCondition.type] = textIsContainedInValue` or `triggerAction[serverSideCondition.type] = textIsNotContainedInValue` or `triggerAction[serverSideCondition.type] = text=value` or `triggerAction[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `triggerAction[serverSideCondition.type] = item=value` or `triggerAction[serverSideCondition.type] = item!=value` or `triggerAction[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `triggerAction[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `triggerAction[serverSideCondition.type] = itemIsNull` or `triggerAction[serverSideCondition.type] = itemIsNotNull` or `triggerAction[serverSideCondition.type] = itemIsZero` or `triggerAction[serverSideCondition.type] = itemIsNotZero` or `triggerAction[serverSideCondition.type] = itemIsNullOrZero` or `triggerAction[serverSideCondition.type] = itemIsNotNullAndNotZero` or `triggerAction[serverSideCondition.type] = itemContainsNoSpaces` or `triggerAction[serverSideCondition.type] = itemIsNumeric` or `triggerAction[serverSideCondition.type] = itemIsNotNumeric` or `triggerAction[serverSideCondition.type] = itemIsAlphanumeric` or `triggerAction[serverSideCondition.type] = itemIsInColonDelimitedList` or `triggerAction[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `triggerAction[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[serverSideCondition.type] = itemIsInColonDelimitedList` or `triggerAction[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `triggerAction[serverSideCondition.type] = userPreference=value` or `triggerAction[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `triggerAction[serverSideCondition.type] = currentPage=page` or `triggerAction[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `triggerAction[serverSideCondition.type] = currentPageInList` or `triggerAction[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[serverSideCondition.type] = textIsContainedInItem` or `triggerAction[serverSideCondition.type] = textIsContainedInValue` or `triggerAction[serverSideCondition.type] = textIsNotContainedInValue` or `triggerAction[serverSideCondition.type] = text=value` or `triggerAction[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `triggerAction[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `triggerAction[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[serverSideCondition.type] = expression` and `triggerAction[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[serverSideCondition.type] = expression` and `triggerAction[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[serverSideCondition.type] = expression` and `triggerAction[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[serverSideCondition.type] = functionBody` and `triggerAction[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[serverSideCondition.type] = functionBody` and `triggerAction[serverSideCondition.language] = javaScript-mle`;

### execution

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `stopExecutionOnError` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `waitForResult` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### clientSideCondition

- `type` — `<STRING>`; Specify a client-side condition, to control whether the action fires.; No; —; `<enum:[item=value:"Item = Value", item!=value:"Item != Value", item>value:"Item > Value", item>=value:"Item >= Value", item<value:"Item < Value", item<=value:"Item <= Value", itemIsNull:"Item is null", itemIsNotNull:"Item is not null", itemIsInList:"Item is in list", itemIsNotInList:"Item is not in list", jsExpression:"JavaScript expression"]>`; —; —;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[clientSideCondition.type] = item=value` or `triggerAction[clientSideCondition.type] = item!=value` or `triggerAction[clientSideCondition.type] = item>value` or `triggerAction[clientSideCondition.type] = item>=value` or `triggerAction[clientSideCondition.type] = item<value` or `triggerAction[clientSideCondition.type] = item<=value`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[clientSideCondition.type] = itemIsInList` or `triggerAction[clientSideCondition.type] = itemIsNotInList`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[clientSideCondition.type] = jsExpression`;
- `item` — `<STRING>`; Enter the page item used in this condition. You can type in the name or pick from the list of available items.; Yes; —; —; maxLength=4000, textCase=UPPER; `triggerAction[clientSideCondition.type] = item=value` or `triggerAction[clientSideCondition.type] = item!=value` or `triggerAction[clientSideCondition.type] = item>value` or `triggerAction[clientSideCondition.type] = item>=value` or `triggerAction[clientSideCondition.type] = item<value` or `triggerAction[clientSideCondition.type] = item<=value` or `triggerAction[clientSideCondition.type] = itemIsNull` or `triggerAction[clientSideCondition.type] = itemIsNotNull` or `triggerAction[clientSideCondition.type] = itemIsInList` or `triggerAction[clientSideCondition.type] = itemIsNotInList`;

### affectedElements

- `selectionType` — `<STRING>`; —; No; —; `<enum:[items:"Item(s)", button:"Button", region:"Region", columns:"Column(s)", domObject:"DOM Object", jquerySelector:"jQuery Selector", javaScriptExpression:"JavaScript Expression", triggeringElement:"Triggering Element", eventSource:"Event Source"]>`; —; —;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[affectedElements.selectionType] = javaScriptExpression` or `triggerAction[affectedElements.selectionType] = javaScriptExpression` or `triggerAction[affectedElements.selectionType] = javaScriptExpression` or `triggerAction[affectedElements.selectionType] = javaScriptExpression` or `triggerAction[affectedElements.selectionType] = javaScriptExpression` or `triggerAction[affectedElements.selectionType] = javaScriptExpression` or `triggerAction[affectedElements.selectionType] = javaScriptExpression`;
- `region` — `<@region>`; —; Yes; —; —; lovType=COMPONENT; `triggerAction[affectedElements.selectionType] = region` or `triggerAction[affectedElements.selectionType] = region` or `triggerAction[affectedElements.selectionType] = region` or `triggerAction[affectedElements.selectionType] = region` or `triggerAction[affectedElements.selectionType] = region` or `triggerAction[affectedElements.selectionType] = region` or `triggerAction[affectedElements.selectionType] = region`;
- `button` — `<@button>`; —; Yes; —; —; lovType=COMPONENT; `triggerAction[affectedElements.selectionType] = button` or `triggerAction[affectedElements.selectionType] = button` or `triggerAction[affectedElements.selectionType] = button` or `triggerAction[affectedElements.selectionType] = button` or `triggerAction[affectedElements.selectionType] = button` or `triggerAction[affectedElements.selectionType] = button` or `triggerAction[affectedElements.selectionType] = button`;
- `items` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `triggerAction[affectedElements.selectionType] = items` or `triggerAction[affectedElements.selectionType] = items` or `triggerAction[affectedElements.selectionType] = items` or `triggerAction[affectedElements.selectionType] = items` or `triggerAction[affectedElements.selectionType] = items` or `triggerAction[affectedElements.selectionType] = items` or `triggerAction[affectedElements.selectionType] = items`;
- `jquerySelector` — `<STRING>`; —; Yes; —; —; maxLength=4000; `triggerAction[affectedElements.selectionType] = jquerySelector` or `triggerAction[affectedElements.selectionType] = jquerySelector` or `triggerAction[affectedElements.selectionType] = jquerySelector` or `triggerAction[affectedElements.selectionType] = jquerySelector` or `triggerAction[affectedElements.selectionType] = jquerySelector` or `triggerAction[affectedElements.selectionType] = jquerySelector` or `triggerAction[affectedElements.selectionType] = jquerySelector`;

### genAI

- `enabled` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `agent` — `<@aiAgent>`; —; No; —; —; lovType=COMPONENT; `triggerAction[genAI.enabled] = Y` or `triggerAction[genAI.enabled] = Y`;
- `itemsToSubmit` — `<STRING>`; —; No; —; —; maxLength=4000, textCase=UPPER; `triggerAction[genAI.enabled] = Y` or `triggerAction[genAI.enabled] = Y`;
- `service` — `<@genAIService>`; —; No; —; —; lovType=COMPONENT; `triggerAction[genAI.enabled] = Y` or `triggerAction[genAI.enabled] = Y`;
- `systemPrompt` — `<STRING>`; —; No; —; —; —; `triggerAction[genAI.enabled] = Y` or `triggerAction[genAI.enabled] = Y`;
- `welcomeMessage` — `<STRING>`; —; No; —; —; —; `triggerAction[genAI.enabled] = Y` or `triggerAction[genAI.enabled] = Y`;

