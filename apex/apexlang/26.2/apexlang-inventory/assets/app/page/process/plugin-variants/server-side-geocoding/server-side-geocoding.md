# plugin-variants/serverSideGeocoding

- componentType: `process`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter the name of the process for easy identification by developers.; Yes; —; —; maxLength=255; —;
- `executionChain` — `<@process>`; —; No; —; —; lovType=COMPONENT; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[serverSideGeocoding:"Server Side Geocoding"]>`; —; —;
- `formRegion` — `<@region>`; —; Yes; —; —; lovType=COMPONENT; —;
- `editableRegion` — `<@region>`; —; No; —; —; lovType=COMPONENT; —;

### advanced

- `executionMappingIdentifier` — `<STRING>`; —; No; —; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### serverSideCondition

- `whenButtonPressed` — `<@button>`; —; No; —; —; lovType=COMPONENT; —;
- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `process[serverSideCondition.type] = rowsReturned` or `process[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `process[serverSideCondition.type] = request=Value` or `process[serverSideCondition.type] = request!=Value` or `process[serverSideCondition.type] = requestIsContainedInValue` or `process[serverSideCondition.type] = requestIsNotContainedInValue` or `process[serverSideCondition.type] = currentLanguageIsContainedInValue` or `process[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `process[serverSideCondition.type] = currentLanguage!=value` or `process[serverSideCondition.type] = currentLanguage=value` or `process[serverSideCondition.type] = cgiEnvDadName=value` or `process[serverSideCondition.type] = cgiEnvDadName!=value` or `process[serverSideCondition.type] = cgiEnvServerName=value` or `process[serverSideCondition.type] = cgiEnvServerName!=value` or `process[serverSideCondition.type] = cgiEnvHttpHost=value` or `process[serverSideCondition.type] = cgiEnvHttpHost!=value` or `process[serverSideCondition.type] = item=value` or `process[serverSideCondition.type] = item!=value` or `process[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `process[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `process[serverSideCondition.type] = textIsContainedInValue` or `process[serverSideCondition.type] = textIsNotContainedInValue` or `process[serverSideCondition.type] = text=value` or `process[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `process[serverSideCondition.type] = item=value` or `process[serverSideCondition.type] = item!=value` or `process[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `process[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `process[serverSideCondition.type] = itemIsNull` or `process[serverSideCondition.type] = itemIsNotNull` or `process[serverSideCondition.type] = itemIsZero` or `process[serverSideCondition.type] = itemIsNotZero` or `process[serverSideCondition.type] = itemIsNullOrZero` or `process[serverSideCondition.type] = itemIsNotNullAndNotZero` or `process[serverSideCondition.type] = itemContainsNoSpaces` or `process[serverSideCondition.type] = itemIsNumeric` or `process[serverSideCondition.type] = itemIsNotNumeric` or `process[serverSideCondition.type] = itemIsAlphanumeric` or `process[serverSideCondition.type] = itemIsInColonDelimitedList` or `process[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `process[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `process[serverSideCondition.type] = itemIsInColonDelimitedList` or `process[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `process[serverSideCondition.type] = userPreference=value` or `process[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `process[serverSideCondition.type] = currentPage=page` or `process[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `process[serverSideCondition.type] = currentPageInList` or `process[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `process[serverSideCondition.type] = textIsContainedInItem` or `process[serverSideCondition.type] = textIsContainedInValue` or `process[serverSideCondition.type] = textIsNotContainedInValue` or `process[serverSideCondition.type] = text=value` or `process[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `process[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `process[serverSideCondition.type] = functionBody`;
- `executionScope` — `<STRING>`; —; Yes; `Y`; `<enum:[forCreatedAndModifiedRows:"For Created and Modified Rows", allSubmittedRows:"All Submitted Rows"]>`; —; `process[identification.editableRegion] = sample`;
- `executeCondition` — `<STRING>`; —; Yes; `Y`; `<enum:[forEachRow:"For Each Row", once:"Once"]>`; —; `process[identification.editableRegion] = sample` and `process[serverSideCondition.type] = sample`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `process[serverSideCondition.type] = expression` and `process[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `process[serverSideCondition.type] = expression` and `process[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `process[serverSideCondition.type] = expression` and `process[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `process[serverSideCondition.type] = functionBody` and `process[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `process[serverSideCondition.type] = functionBody` and `process[serverSideCondition.language] = javaScript-mle`;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### successMessage

- `successMessage` — `<STRING>`; Enter the success message for this process. If the process runs and does not generate an error, then this process success message displays in the notification section of the resulting page displayed. If you are branching to another page via a URL redirect, you may need to check the preserve success message attribute. For multi row processes, the following substitution string can be used to get the number of records processed:    Insert: #MRI_COUNT#   Update: #MRU_COUNT#   Delete: #MRD_COUNT#  For the Send E-Mail process type the substitution string #TO# can be used to get the addressees of the e-mail. Plug-ins can have other substitution strings as well. See Plug-in documentation for details.; No; —; —; maxLength=4000; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### error

- `errorMessage` — `<STRING>`; Enter the error message for this process. This message displays if an unhandled exception is raised. After any error processing stops, a rollback is issued and an error message displays. Note: the SQL error message sqlerrm displays by default if On Error Page is defined as the error display location, there is no need to add #SQLERRM# to your error text. Error messages can include the following substitution strings:    #SQLERRM_TEXT#   Text of error message without the error number.   #SQLERRM#   Complete error message. ; No; —; —; maxLength=4000; —;
- `displayLocation` — `<STRING>`; —; Yes; `INLINE_IN_NOTIFICATION`; `<enum:[inlineInNotification:"Inline in Notification", onErrorPage:"On Error Page"]>`; —; `process[execution.point] = afterSubmit` or `process[execution.point] = processing`;

### execution

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `point` — `<STRING>`; —; Yes; `AFTER_SUBMIT`; `<enum:[newSession:"New Session", beforeHeader:"Before Header", afterHeader:"After Header", beforeRegions:"Before Regions", afterRegions:"After Regions", beforeFooter:"Before Footer", afterFooter:"After Footer", afterSubmit:"After Submit", processing:"Processing", ajaxCallback:"Ajax Callback"]>`; —; —;
- `runProcess` — `<STRING>`; —; Yes; `N`; `<enum:[oncePerSessionOrWhenReset:"Once Per Session or When Reset", oncePerPageVisitDefault:"Once Per Page Visit (default)"]>`; —; —;

### address

- `structuredAddress` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `sanitizeAddress` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `process[address.structuredAddress] = Y`;

### geocodingResult

- `matchVectorItem` — `<STRING>`; —; No; —; —; maxLength=4000, textCase=UPPER; —;
- `collectionName` — `<STRING>`; —; No; —; —; maxLength=30; —;
- `coordinateItem` — `<STRING>`; —; No; —; —; maxLength=4000, textCase=UPPER; —;

### source

- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL"]>`; —; —;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `process[source.location] = restEnabledSql`;
- `plsqlCode` — `<STRING>`; Enter the PL/SQL code to be executed on the remote database.; Yes; —; —; —; `process[source.location] = restEnabledSql`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `process[source.location] = localDatabase`;
- `plsqlCode` — `<STRING>`; —; Yes; —; —; —; `process[source.location] = localDatabase` and `process[source.language] = plsql`;
- `javaScriptCode` — `<STRING>`; —; Yes; —; —; —; `process[source.location] = localDatabase` and `process[source.language] = javaScript-mle`;

### genAI

- `enabled` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `agent` — `<@aiAgent>`; —; No; —; —; lovType=COMPONENT; `process[genAI.enabled] = Y`;
- `service` — `<@genAIService>`; —; No; —; —; lovType=COMPONENT; `process[genAI.enabled] = Y`;
- `systemPrompt` — `<STRING>`; —; No; —; —; —; `process[genAI.enabled] = Y`;

### geocodingInput

- `countryType` — `<STRING>`; —; Yes; `STATIC`; `<enum:[item:"Item", static:"Static"]>`; maxLength=4000; `process[address.structuredAddress] = Y`;
- `regionItem` — `<STRING>`; —; No; —; —; maxLength=4000, textCase=UPPER; `process[address.structuredAddress] = Y`;
- `citySubAreaItem` — `<STRING>`; —; No; —; —; maxLength=4000, textCase=UPPER; `process[address.structuredAddress] = Y`;
- `postalCodeItem` — `<STRING>`; —; No; —; —; maxLength=4000, textCase=UPPER; `process[address.structuredAddress] = Y`;
- `streetItem` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `process[address.structuredAddress] = Y`;
- `cityItem` — `<STRING>`; —; No; —; —; maxLength=4000, textCase=UPPER; `process[address.structuredAddress] = Y`;
- `addressItem` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `process[address.structuredAddress] = N`;
- `houseNoItem` — `<STRING>`; —; No; —; —; maxLength=4000, textCase=UPPER; `process[address.structuredAddress] = Y`;
- `country` — `<STRING>`; —; Yes; `US`; `<enum:[us:"United States", co:"Colombia", dk:"Denmark", hk:"Hong Kong", be:"Belgium", hu:"Hungary", de:"Germany", pl:"Poland", pt:"Portugal", ch:"Switzerland", za:"South Africa", nl:"Netherlands", ee:"Estonia", it:"Italy", ie:"Ireland", at:"Austria", uk:"United Kingdom", fi:"Finland", in:"India", lv:"Latvia", cz:"Czech Republic", es:"Spain", fr:"France", cl:"Chile", no:"Norway", sa:"Saudi Arabia", ae:"United Arab Emirates", ro:"Romania", ca:"Canada", mx:"Mexico", au:"Australia", br:"Brazil"]>`; maxLength=4000; `process[address.structuredAddress] = Y` and `process[geocodingInput.countryType] = static`;
- `countryItem` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `process[address.structuredAddress] = Y` and `process[geocodingInput.countryType] = item`;

