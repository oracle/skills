# page

- componentType: `page`
- identifierRequired: true
- filePath: `pages/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter the name of the current page. This name is used in numerous Oracle APEX pages and reports, along with the page number and title.; Yes; —; —; maxLength=255; —;
- `page` — `<NUMBER>`; —; Yes; —; —; —; —;
- `title` — `<STRING>`; Enter a title that will be displayed in the title bar of the browser window, and announced to screen reader users when they first open the page.         The Oracle APEX engine uses the title you specify here in place of the #TITLE# substitution string used in the page template. This title is inserted between the         HTML tags &lt\;TITLE&gt\; and &lt\;/TITLE&gt\;.         A good page title should provide a clear and concise description of the purpose of the page, can include the application name and sub-section of the application for additional         context, and should always include the most important, and unique information first. For example, if you have a 'Products' page in an 'Administration' section of a 'Customer Portal'         application, the page title could be defined as 'Products | Admin | Customer Portal'.; No; —; —; maxLength=255; —;
- `alias` — `<STRING>`; —; No; —; —; maxLength=80, textCase=UPPER; —;
- `pageGroup` — `<@pageGroup>`; —; No; —; —; lovType=COMPONENT; `app[identification.type] = standard` or `app[identification.type] = boilerplate`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### appearance

- `templateOptions` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;
- `pageMode` — `<STRING>`; —; Yes; `NORMAL`; `<enum:[normal:"Normal", modalDialog:"Modal Dialog", nonModalDialog:"Non-Modal Dialog"]>`; —; —;
- `mediaType` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `cssClasses` — `<STRING>`; Enter classes to add to this component. You may add multiple classes by separating them with spaces.; No; —; —; maxLength=255; —;
- `pageTemplate` — `<@pageTemplate>`; —; Yes; —; `<enum:[@/blank, @/left-and-right-side-columns, @/left-side-column, @/login, @/marquee, @/minimal-no-navigation, @/right-side-column, @/standard]>`; —; `page[appearance.pageMode] = normal`;
- `dialogTemplate` — `<@pageTemplate>`; —; Yes; —; `<enum:[@/drawer, @/modal-dialog, @/wizard-modal-dialog]>`; —; `page[appearance.pageMode] = modalDialog` or `page[appearance.pageMode] = nonModalDialog`;

### help

- `helpText` — `<STRING>`; —; No; —; —; —; —;

### navigation

- `cursorFocus` — `<STRING>`; —; Yes; `NO_FIRST_ITEM`; `<enum:[firstItemOnPage:"First item on page", doNotFocusCursor:"Do not focus cursor"]>`; —; —;
- `warnOnUnsavedChanges` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### javaScript

- `fileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `functionAndGlobalVariableDeclaration` — `<STRING>`; —; No; —; —; —; —;
- `executeWhenPageLoads` — `<STRING>`; —; No; —; —; —; —;
- `includeStandardJavaScriptAndCss` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### htmlHeader

- `htmlHeader` — `<STRING>`; —; No; —; —; —; —;
- `pageHtmlBodyAttribute` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### headerAndFooter

- `headerText` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `bodyHeader` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `footerText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverCache

- `caching` — `<STRING>`; —; Yes; `NOCACHE`; `<enum:[false:"Disabled", true:"Enabled", cacheByUser:"Cache By User", cacheBySession:"Cache By Session"]>`; —; —;
- `cacheTimeout` — `<STRING>`; —; Yes; `21600`; `<enum:[10Seconds:"10 seconds", 1Minute:"1 minute", 10Minutes:"10 minutes", 30Minutes:"30 minutes", 1Hour:"1 hour", 2Hours:"2 hours", 3Hours:"3 hours", 4Hours:"4 hours", 6Hours:"6 hours", 12Hours:"12 hours", 1Day:"1 day", 2Days:"2 days", 3Days:"3 days", 4Days:"4 days", 1Week:"1 week", 2Weeks:"2 weeks", 4Weeks:"4 Weeks", 10Weeks:"10 Weeks", 1Year:"1 Year"]>`; —; —;
- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[serverCache.type] = rowsReturned` or `page[serverCache.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[serverCache.type] = request=Value` or `page[serverCache.type] = request!=Value` or `page[serverCache.type] = requestIsContainedInValue` or `page[serverCache.type] = requestIsNotContainedInValue` or `page[serverCache.type] = currentLanguageIsContainedInValue` or `page[serverCache.type] = currentLanguageIsNotContainedInValue` or `page[serverCache.type] = currentLanguage!=value` or `page[serverCache.type] = currentLanguage=value` or `page[serverCache.type] = cgiEnvDadName=value` or `page[serverCache.type] = cgiEnvDadName!=value` or `page[serverCache.type] = cgiEnvServerName=value` or `page[serverCache.type] = cgiEnvServerName!=value` or `page[serverCache.type] = cgiEnvHttpHost=value` or `page[serverCache.type] = cgiEnvHttpHost!=value` or `page[serverCache.type] = item=value` or `page[serverCache.type] = item!=value` or `page[serverCache.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `page[serverCache.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `page[serverCache.type] = userPreference=value` or `page[serverCache.type] = userPreference!=value` or `page[serverCache.type] = textIsContainedInValue` or `page[serverCache.type] = textIsNotContainedInValue` or `page[serverCache.type] = text=value` or `page[serverCache.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `page[serverCache.type] = item=value` or `page[serverCache.type] = item!=value` or `page[serverCache.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `page[serverCache.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `page[serverCache.type] = itemIsNull` or `page[serverCache.type] = itemIsNotNull` or `page[serverCache.type] = itemIsZero` or `page[serverCache.type] = itemIsNotZero` or `page[serverCache.type] = itemIsNullOrZero` or `page[serverCache.type] = itemIsNotNullAndNotZero` or `page[serverCache.type] = itemContainsNoSpaces` or `page[serverCache.type] = itemIsNumeric` or `page[serverCache.type] = itemIsNotNumeric` or `page[serverCache.type] = itemIsAlphanumeric` or `page[serverCache.type] = itemIsInColonDelimitedList` or `page[serverCache.type] = itemIsNotInColonDelimitedList` or `page[serverCache.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[serverCache.type] = itemIsInColonDelimitedList` or `page[serverCache.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `page[serverCache.type] = userPreference=value` or `page[serverCache.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `page[serverCache.type] = currentPage=page` or `page[serverCache.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `page[serverCache.type] = currentPageInList` or `page[serverCache.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[serverCache.type] = textIsContainedInItem` or `page[serverCache.type] = textIsContainedInValue` or `page[serverCache.type] = textIsNotContainedInValue` or `page[serverCache.type] = text=value` or `page[serverCache.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `page[serverCache.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `page[serverCache.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[serverCache.type] = expression` and `page[serverCache.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[serverCache.type] = expression` and `page[serverCache.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[serverCache.type] = expression` and `page[serverCache.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[serverCache.type] = functionBody` and `page[serverCache.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[serverCache.type] = functionBody` and `page[serverCache.language] = javaScript-mle`;

### security

- `authorizationScheme` — `<@authorization>`; Select an authorization scheme applied to the page. Authorization schemes are defined at the application-level and can be applied to many elements within the application. An authorization scheme is evaluated either once for each application session (at session creation), or once for each page view. If the selected authorization scheme evaluates to TRUE, then the page displays and is subject to other defined conditions. If it evaluates to FALSE, then the page does not display and an error message displays.; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;
- `authentication` — `<STRING>`; —; Yes; `N`; `<enum:[required:"Page Requires Authentication", public:"Page Is Public"]>`; —; —;
- `deepLinking` — `<STRING>`; —; No; —; `<enum:[true:"Enabled", false:"Disabled"]>`; —; —;
- `pageAccessProtection` — `<STRING>`; —; Yes; `C`; `<enum:[unrestricted:"Unrestricted", argumentsMustHaveChecksum:"Arguments Must Have Checksum", noArgumentsSupported:"No Arguments Supported", noUrlAccess:"No URL Access"]>`; —; —;
- `formAutoComplete` — `<STRING>`; —; Yes; `OFF`; `<enum:[true:"On", false:"Off"]>`; —; —;
- `browserCache` — `<STRING>`; —; No; —; `<enum:[true:"Enabled", false:"Disabled"]>`; —; —;

### navigationMenu

- `overrideUserInterfaceLevel` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `list` — `<@list>`; —; No; —; —; lovType=COMPONENT; `page[navigationMenu.overrideUserInterfaceLevel] = Y`;
- `listTemplate` — `<@listTemplate>`; —; Yes; —; `<enum:[@/badge-list, @/cards, @/links-list, @/media-list, @/menu-bar, @/menu-popup, @/navigation-bar, @/side-navigation-menu, @/tabs, @/top-navigation-mega-menu, @/top-navigation-menu, @/top-navigation-tabs, @/wizard-progress]>`; —; `page[navigationMenu.overrideUserInterfaceLevel] = Y` and `page[navigationMenu.list] = sample`;
- `listPosition` — `<STRING>`; —; Yes; —; `<enum:[top:"Top", side:"Side"]>`; —; `page[navigationMenu.overrideUserInterfaceLevel] = Y` and `page[navigationMenu.list] = sample`;
- `templateOptions` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; `page[navigationMenu.overrideUserInterfaceLevel] = Y` and `page[navigationMenu.list] = sample`;

### advanced

- `enableDuplicatePageSubmissions` — `<STRING>`; —; Yes; `Y`; `<enum:[false:"No - Prevent page from being re-posted", true:"Yes - Enable page to be re-posted"]>`; —; —;
- `reloadOnSubmit` — `<STRING>`; —; Yes; `S`; `<enum:[always:"Always", onlyForSuccess:"Only for Success"]>`; —; —;
- `duplicateSubmissionUrl` — `<STRING>`; —; No; —; —; maxLength=4000; `page[advanced.enableDuplicatePageSubmissions] = false`;
- `enableMetaTags` — `<BOOLEAN>`; —; Yes; `N`; —; —; `page[security.authentication] = public`;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### errorHandling

- `inLineErrorNotificationText` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `errorHandlingFunctionName` — `<STRING>`; —; No; —; —; maxLength=255; —;

### css

- `fileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `inline` — `<STRING>`; —; No; —; —; —; —;

### readOnly

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[readOnly.type] = rowsReturned` or `page[readOnly.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[readOnly.type] = request=Value` or `page[readOnly.type] = request!=Value` or `page[readOnly.type] = requestIsContainedInValue` or `page[readOnly.type] = requestIsNotContainedInValue` or `page[readOnly.type] = currentLanguageIsContainedInValue` or `page[readOnly.type] = currentLanguageIsNotContainedInValue` or `page[readOnly.type] = currentLanguage!=value` or `page[readOnly.type] = currentLanguage=value` or `page[readOnly.type] = cgiEnvDadName=value` or `page[readOnly.type] = cgiEnvDadName!=value` or `page[readOnly.type] = cgiEnvServerName=value` or `page[readOnly.type] = cgiEnvServerName!=value` or `page[readOnly.type] = cgiEnvHttpHost=value` or `page[readOnly.type] = cgiEnvHttpHost!=value` or `page[readOnly.type] = item=value` or `page[readOnly.type] = item!=value` or `page[readOnly.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `page[readOnly.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `page[readOnly.type] = userPreference=value` or `page[readOnly.type] = userPreference!=value` or `page[readOnly.type] = textIsContainedInValue` or `page[readOnly.type] = textIsNotContainedInValue` or `page[readOnly.type] = text=value` or `page[readOnly.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `page[readOnly.type] = item=value` or `page[readOnly.type] = item!=value` or `page[readOnly.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `page[readOnly.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `page[readOnly.type] = itemIsNull` or `page[readOnly.type] = itemIsNotNull` or `page[readOnly.type] = itemIsZero` or `page[readOnly.type] = itemIsNotZero` or `page[readOnly.type] = itemIsNullOrZero` or `page[readOnly.type] = itemIsNotNullAndNotZero` or `page[readOnly.type] = itemContainsNoSpaces` or `page[readOnly.type] = itemIsNumeric` or `page[readOnly.type] = itemIsNotNumeric` or `page[readOnly.type] = itemIsAlphanumeric` or `page[readOnly.type] = itemIsInColonDelimitedList` or `page[readOnly.type] = itemIsNotInColonDelimitedList` or `page[readOnly.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[readOnly.type] = itemIsInColonDelimitedList` or `page[readOnly.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `page[readOnly.type] = userPreference=value` or `page[readOnly.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `page[readOnly.type] = currentPage=page` or `page[readOnly.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `page[readOnly.type] = currentPageInList` or `page[readOnly.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[readOnly.type] = textIsContainedInItem` or `page[readOnly.type] = textIsContainedInValue` or `page[readOnly.type] = textIsNotContainedInValue` or `page[readOnly.type] = text=value` or `page[readOnly.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `page[readOnly.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `page[readOnly.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[readOnly.type] = expression` and `page[readOnly.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[readOnly.type] = expression` and `page[readOnly.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[readOnly.type] = expression` and `page[readOnly.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[readOnly.type] = functionBody` and `page[readOnly.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `page[readOnly.type] = functionBody` and `page[readOnly.language] = javaScript-mle`;

### sessionManagement

- `rejoinSessions` — `<STRING>`; —; No; —; `<enum:[false:"Disabled", publicSessions:"Enabled for Public Sessions", allSessions:"Enabled for All Sessions"]>`; —; —;

### dialog

- `height` — `<STRING>`; —; No; —; —; maxLength=20; `page[appearance.pageMode] = modalDialog` or `page[appearance.pageMode] = nonModalDialog`;
- `width` — `<STRING>`; —; No; —; —; maxLength=20; `page[appearance.pageMode] = modalDialog` or `page[appearance.pageMode] = nonModalDialog`;
- `maxWidth` — `<STRING>`; —; No; —; —; maxLength=20; `page[appearance.pageMode] = modalDialog` or `page[appearance.pageMode] = nonModalDialog`;
- `attributes` — `<STRING>`; —; No; —; —; maxLength=255; `page[appearance.pageMode] = modalDialog` or `page[appearance.pageMode] = nonModalDialog`;
- `cssClasses` — `<STRING>`; —; No; —; —; maxLength=255; `page[appearance.pageMode] = modalDialog` or `page[appearance.pageMode] = nonModalDialog`;
- `chained` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `page[appearance.pageMode] = modalDialog` or `page[appearance.pageMode] = nonModalDialog`;
- `resizable` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `page[appearance.pageMode] = modalDialog` or `page[appearance.pageMode] = nonModalDialog`;

