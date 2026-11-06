# plugin-variants/textField

- componentType: `pageItem`
- identifierRequired: true

## Properties

### security

- `sessionStateProtection` — `<STRING>`; —; Yes; `N`; `<enum:[unrestricted:"Unrestricted", checksumRequiredAppLevel:"Checksum Required - Application Level", checksumRequiredUserLevel:"Checksum Required - User Level", checksumRequiredSessionLevel:"Checksum Required - Session Level", restricted:"Restricted - May not be set from browser"]>`; —; —;
- `restrictedChars` — `<STRING>`; —; No; —; `<enum:[alphanumWithSpace:"Allowlist for a-Z, 0-9 and space", webSafe:"Blocklist HTML command characters (")", noSpecialChar:"Blocklist &"/\;,*|=% and --", noSpecialCharNoNewline:"Blocklist &"/\;,*|=% or -- and new line", workspaceSchema:"Workspace Schema", workspaceUserSchema:"Workspace User Schema", workspaceUserSchemaId:"Workspace User Schema ID"]>`; —; —;
- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;
- `encryptSessionState` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `escapeSpecialChars` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### sessionState

- `dataType` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[varchar2:"VARCHAR2", clob:"CLOB", boolean:"BOOLEAN", number:"NUMBER"]>`; maxLength=128; —;
- `storage` — `<STRING>`; —; Yes; `N`; `<enum:[request:"Per Request (Memory Only)", session:"Per Session (Persistent)"]>`; —; `pageItem[source.formRegion] = sample`;
- `storage` — `<STRING>`; —; Yes; `Y`; `<enum:[request:"Per Request (Memory Only)", session:"Per Session (Persistent)", user:"Per User (Persistent)"]>`; —; —;

### layout

- `slot` — `<STRING>`; —; Yes; —; —; lovType=SLOTS; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `region` — `<@region>`; Select the region in which the item will be displayed.; No; —; —; lovType=COMPONENT; —;
- `startNewLayout` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `column` — `<STRING>`; —; No; —; —; lovType=GRID_COLUMNS; —;
- `columnSpan` — `<STRING>`; —; No; —; —; lovType=GRID_COLUMNS; —;
- `rowSpan` — `<NUMBER>`; —; No; —; —; —; —;
- `columnAttributes` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `alignment` — `<STRING>`; —; Yes; `LEFT-CENTER`; `<enum:[center:"Center", centerBottom:"Center bottom", centerCenter:"Center center", centerTop:"Center top", left:"Left", leftBottom:"Left bottom", leftCenter:"Left center", leftTop:"Left top", right:"Right", rightBottom:"Right bottom", rightCenter:"Right center", rightTop:"Right top"]>`; —; —;
- `labelColumnSpan` — `<STRING>`; —; No; —; —; lovType=GRID_COLUMNS; —;
- `columnCssClasses` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `rowCssClasses` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `startNewRow` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `pageItem[layout.startNewLayout] = N`;
- `newColumn` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `pageItem[layout.startNewLayout] = N` and `pageItem[layout.startNewRow] = N`;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### help

- `helpText` — `<STRING>`; Enter help text for this item. The help text may be used to provide field level context sensitive help.; No; —; —; maxLength=4000; —;
- `inlineHelpText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[serverSideCondition.type] = rowsReturned` or `pageItem[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[serverSideCondition.type] = request=Value` or `pageItem[serverSideCondition.type] = request!=Value` or `pageItem[serverSideCondition.type] = requestIsContainedInValue` or `pageItem[serverSideCondition.type] = requestIsNotContainedInValue` or `pageItem[serverSideCondition.type] = currentLanguageIsContainedInValue` or `pageItem[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `pageItem[serverSideCondition.type] = currentLanguage!=value` or `pageItem[serverSideCondition.type] = currentLanguage=value` or `pageItem[serverSideCondition.type] = cgiEnvDadName=value` or `pageItem[serverSideCondition.type] = cgiEnvDadName!=value` or `pageItem[serverSideCondition.type] = cgiEnvServerName=value` or `pageItem[serverSideCondition.type] = cgiEnvServerName!=value` or `pageItem[serverSideCondition.type] = cgiEnvHttpHost=value` or `pageItem[serverSideCondition.type] = cgiEnvHttpHost!=value` or `pageItem[serverSideCondition.type] = item=value` or `pageItem[serverSideCondition.type] = item!=value` or `pageItem[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `pageItem[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `pageItem[serverSideCondition.type] = textIsContainedInValue` or `pageItem[serverSideCondition.type] = textIsNotContainedInValue` or `pageItem[serverSideCondition.type] = text=value` or `pageItem[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `pageItem[serverSideCondition.type] = item=value` or `pageItem[serverSideCondition.type] = item!=value` or `pageItem[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `pageItem[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `pageItem[serverSideCondition.type] = itemIsNull` or `pageItem[serverSideCondition.type] = itemIsNotNull` or `pageItem[serverSideCondition.type] = itemIsZero` or `pageItem[serverSideCondition.type] = itemIsNotZero` or `pageItem[serverSideCondition.type] = itemIsNullOrZero` or `pageItem[serverSideCondition.type] = itemIsNotNullAndNotZero` or `pageItem[serverSideCondition.type] = itemContainsNoSpaces` or `pageItem[serverSideCondition.type] = itemIsNumeric` or `pageItem[serverSideCondition.type] = itemIsNotNumeric` or `pageItem[serverSideCondition.type] = itemIsAlphanumeric` or `pageItem[serverSideCondition.type] = itemIsInColonDelimitedList` or `pageItem[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `pageItem[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[serverSideCondition.type] = itemIsInColonDelimitedList` or `pageItem[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `pageItem[serverSideCondition.type] = userPreference=value` or `pageItem[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `pageItem[serverSideCondition.type] = currentPage=page` or `pageItem[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `pageItem[serverSideCondition.type] = currentPageInList` or `pageItem[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[serverSideCondition.type] = textIsContainedInItem` or `pageItem[serverSideCondition.type] = textIsContainedInValue` or `pageItem[serverSideCondition.type] = textIsNotContainedInValue` or `pageItem[serverSideCondition.type] = text=value` or `pageItem[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `pageItem[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `pageItem[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[serverSideCondition.type] = expression` and `pageItem[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[serverSideCondition.type] = expression` and `pageItem[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[serverSideCondition.type] = expression` and `pageItem[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[serverSideCondition.type] = functionBody` and `pageItem[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[serverSideCondition.type] = functionBody` and `pageItem[serverSideCondition.language] = javaScript-mle`;

### identification (direct group)

- `type` — `<STRING>`; —; Yes; —; `<enum:[textField:"Text Field"]>`; —; —;
- `name` — `<STRING>`; —; Yes; `P#PAGE_ID#_NEW`; —; maxLength=255, textCase=UPPER; —;

### advanced

- `warnOnUnsavedChanges` — `<STRING>`; —; No; —; `<enum:[ignore:"Ignore"]>`; —; —;
- `cssClasses` — `<STRING>`; Enter classes to add to this component. You may add multiple classes by separating them with spaces.         Note: These CSS classes will be applied to the HTML form element tag.; No; —; —; maxLength=255; —;
- `customAttributes` — `<STRING>`; Enter additional attributes to be included in the form element HTML tag. The size and id HTML attributes are generated and therefore should not be supplied. For the class HTML attribute it is better to use the dedicated CSS Classes attribute instead.; No; —; —; maxLength=2000; —;
- `optionHtmlAttributes` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `preText` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `postText` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `initJavaScriptFunction` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### settings

- `subtype` — `<STRING>`; —; Yes; `TEXT`; `<enum:[search:"Search", text:"Text", url:"URL", email:"E-Mail", phone:"Phone Number"]>`; maxLength=4000; —;
- `submitWhenEnterPressed` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `disabled` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `trimSpaces` — `<STRING>`; —; Yes; `BOTH`; `<enum:[leadingAndTrailing:"Leading and Trailing", leading:"Leading", trailing:"Trailing", none:"None"]>`; maxLength=4000; —;
- `textCase` — `<STRING>`; —; No; —; `<enum:[upper:"Upper", lower:"Lower"]>`; maxLength=4000; —;
- `sendOnPageSubmit` — `<BOOLEAN>`; —; Yes; `N`; —; —; `pageItem[settings.disabled] = Y`;

### label

- `alignment` — `<STRING>`; —; Yes; `RIGHT-CENTER`; `<enum:[above:"Above ", below:"Below", center:"Center", centerBottom:"Center bottom", centerCenter:"Center center", centerTop:"Center top", left:"Left", leftBottom:"Left bottom", leftCenter:"Left center", leftTop:"Left top", right:"Right", rightBottom:"Right bottom", rightCenter:"Right center", rightTop:"Right top"]>`; —; —;
- `label` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `tableCellAttributes` — `<STRING>`; —; No; —; —; maxLength=255; —;

### appearance

- `template` — `<@fieldTemplate>`; —; No; —; `<enum:[@/hidden, @/optional, @/optional-above, @/optional-floating, @/required, @/required-above, @/required-floating]>`; —; —;
- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `width` — `<NUMBER>`; —; No; —; —; —; —;
- `height` — `<NUMBER>`; —; No; —; —; —; —;
- `valuePlaceholder` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `icon` — `<STRING>`; Enter the classes for the icon you want to add to the component. You may add multiple classes by separating them with spaces.         If your theme uses Font APEX then review the Universal Theme Sample Application to view available icons and modifiers.         Note: This icon will be displayed inside of the item, not as part of the label.; No; —; —; maxLength=255; —;
- `cssClasses` — `<STRING>`; Enter classes to add to this item. You may add multiple classes by separating them with spaces.         This property can be used to make style modifications to the item, beyond template options, or to provide a simpler way of selecting this item via JavaScript.         Note: To apply CSS classes to the HTML form element tag, please see the CSS Classes property under the Advanced group.; No; —; —; maxLength=255; `pageItem[appearance.template] = sample`;
- `templateOptions` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; `pageItem[appearance.template] = sample`;

### validation

- `valueRequired` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `maxLength` — `<NUMBER>`; —; No; —; —; —; —;

### source

- `formRegion` — `<@region>`; —; No; —; —; lovType=COMPONENT; —;
- `column` — `<STRING>`; —; Yes; —; —; maxLength=128; `pageItem[source.formRegion] = sample`;
- `used` — `<STRING>`; —; Yes; `YES`; `<enum:[always:"Always, replacing any existing value in session state", onlyWhenSessionStateIsNull:"Only when current value in session state is null"]>`; —; —;
- `type` — `<STRING>`; —; Yes; `ALWAYS_NULL`; `<enum:[staticValue:"Static Value", databaseColumn:"Database Column", item:"Item", sqlQuerySingleValue:"SQL Query (return single value)", sqlQueryMultipleValues:"SQL Query (return multiple values)", expression:"Expression", functionBody:"Function Body", preference:"Preference", null:"Null"]>`; —; —;
- `postCalculationComputation` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `dataType` — `<STRING>`; —; Yes; —; `<enum:[varchar2:"VARCHAR2", number:"NUMBER", date:"DATE", timestamp:"TIMESTAMP", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", intervalYearToMonth:"INTERVAL YEAR TO MONTH", intervalDayToSecond:"INTERVAL DAY TO SECOND", clob:"CLOB", blob:"BLOB", boolean:"BOOLEAN", rowid:"ROWID", bfile:"BFILE", sdoGeometry:"SDO_GEOMETRY"]>`; maxLength=128; `pageItem[source.formRegion] = sample`;
- `primaryKey` — `<BOOLEAN>`; —; Yes; `N`; —; —; `pageItem[source.formRegion] = sample`;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[source.type] = staticValue`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[source.type] = sqlQuerySingleValue` or `pageItem[source.type] = sqlQueryMultipleValues`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `pageItem[source.type] = item`;
- `databaseColumn` — `<STRING>`; —; Yes; —; —; maxLength=128; `pageItem[source.type] = databaseColumn`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=255; `pageItem[source.type] = preference`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `pageItem[source.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `pageItem[source.type] = functionBody`;
- `queryOnly` — `<BOOLEAN>`; —; Yes; `N`; —; —; `pageItem[source.formRegion] = sample` and `pageItem[source.formRegion] = sample`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[source.type] = expression` and `pageItem[source.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[source.type] = expression` and `pageItem[source.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[source.type] = expression` and `pageItem[source.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[source.type] = functionBody` and `pageItem[source.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[source.type] = functionBody` and `pageItem[source.language] = javaScript-mle`;

### quickPicks

- `type` — `<STRING>`; —; No; —; `<enum:[static:"Static", sharedLov:"Shared List of Values", sqlQuery:"SQL Query"]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[quickPicks.type] = sqlQuery`;
- `maxDisplayedEntries` — `<INTEGER>`; —; No; —; —; —; `pageItem[quickPicks.type] = sharedLov` or `pageItem[quickPicks.type] = sqlQuery`;
- `linkAttributes` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = sample`;
- `label1` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `value1` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `label2` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `value2` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `label3` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `value3` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `label4` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `value4` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `label5` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `value5` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `label6` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `value6` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `label7` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `value7` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `label8` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `value8` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `label9` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `value9` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `label10` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;
- `value10` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[quickPicks.type] = static`;

### default

- `type` — `<STRING>`; —; No; —; `<enum:[static:"Static", item:"Item", sqlQuerySingleValue:"SQL Query (return single value)", sqlQueryMultipleValues:"SQL Query (return multiple values)", expression:"Expression", functionBody:"Function Body", sequence:"Sequence"]>`; —; —;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[default.type] = static`;
- `item` — `<STRING>`; —; Yes; —; —; textCase=UPPER; `pageItem[default.type] = item`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `pageItem[default.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `pageItem[default.type] = functionBody`;
- `sqlQuerySingleValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[default.type] = sqlQuerySingleValue`;
- `sqlQueryMultipleValues` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[default.type] = sqlQueryMultipleValues`;
- `sequence` — `<STRING>`; —; Yes; —; —; maxLength=128; `pageItem[default.type] = sequence`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[default.type] = expression` and `pageItem[default.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[default.type] = expression` and `pageItem[default.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[default.type] = expression` and `pageItem[default.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[default.type] = functionBody` and `pageItem[default.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[default.type] = functionBody` and `pageItem[default.language] = javaScript-mle`;

### multipleValues

- `type` — `<STRING>`; —; Yes; `SEPARATED`; `<enum:[delimitedList:"Delimited List", jsonArray:"JSON Array"]>`; —; —;
- `type` — `<STRING>`; —; No; —; `<enum:[delimitedList:"Delimited List", jsonArray:"JSON Array"]>`; —; `pageItem[settings.pageActionOnSelection] = none`;
- `separator` — `<STRING>`; —; Yes; `:`; —; maxLength=5; `pageItem[multipleValues.type] = delimitedList` or `pageItem[multipleValues.type] = delimitedList` or `pageItem[multipleValues.type] = delimitedList` or `pageItem[settings.pageActionOnSelection] = none` and `pageItem[multipleValues.type] = delimitedList`;

### lov

- `type` — `<STRING>`; —; No; —; `<enum:[sharedComponent:"Shared Component", sqlQuery:"SQL Query", staticValues:"Static Values", functionBody:"Function Body returning SQL Query"]>`; —; —;
- `lov` — `<@lov>`; —; Yes; —; —; lovType=COMPONENT; `pageItem[lov.type] = sharedComponent`;
- `displayExtraValues` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `pageItem[lov.type] = sample`;
- `displayNullValue` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `pageItem[lov.type] = sample`;
- `sqlQuery` — `<STRING>`; Enter the SQL query definition to populate this list of values. Generally list of value queries are of the form:  select [displayValue],        [returnValue]   from ...  where ...  order by ...  Each column selected must have a unique name or alias. Oracle recommends using an alias on any column that includes an SQL expression. Note: When defining a Popup LOV item type, if you would like to display multiple columns in the popup, you must instead define your List of Values in Shared Components, with the required additional metadata. Inline list of values can only be used to display single columns for Popup LOVs.; Yes; —; —; maxLength=4000; `pageItem[lov.type] = sqlQuery`;
- `staticValues` — `<STRING>`; —; Yes; `STATIC:Display1\;Return1,Display2\;Return2`; —; maxLength=4000; `pageItem[lov.type] = staticValues`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `pageItem[lov.type] = functionBody`;
- `nullDisplayValue` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[lov.type] = sample` and `pageItem[lov.displayNullValue] = Y`;
- `nullReturnValue` — `<STRING>`; —; No; —; —; maxLength=255; `pageItem[lov.type] = sample` and `pageItem[lov.displayNullValue] = Y`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `pageItem[lov.type] = functionBody` and `pageItem[lov.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `pageItem[lov.type] = functionBody` and `pageItem[lov.language] = javaScript-mle`;

### readOnly

- `type` — `<STRING>`; Select a condition type that must be met in order for this component to render as read-only. Not selecting a condition causes the item to render normally. A read-only item is rendered with the same settings as a Display Only item. Note: Set the condition type to Never to always render the item as an enterable field. This setting overwrites any read-only condition setting on the region or page level.; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `readOnlyHtmlAttributes` — `<STRING>`; —; No; —; —; maxLength=4000; `pageItem[readOnly.type] = sample`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[readOnly.type] = rowsReturned` or `pageItem[readOnly.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[readOnly.type] = request=Value` or `pageItem[readOnly.type] = request!=Value` or `pageItem[readOnly.type] = requestIsContainedInValue` or `pageItem[readOnly.type] = requestIsNotContainedInValue` or `pageItem[readOnly.type] = currentLanguageIsContainedInValue` or `pageItem[readOnly.type] = currentLanguageIsNotContainedInValue` or `pageItem[readOnly.type] = currentLanguage!=value` or `pageItem[readOnly.type] = currentLanguage=value` or `pageItem[readOnly.type] = cgiEnvDadName=value` or `pageItem[readOnly.type] = cgiEnvDadName!=value` or `pageItem[readOnly.type] = cgiEnvServerName=value` or `pageItem[readOnly.type] = cgiEnvServerName!=value` or `pageItem[readOnly.type] = cgiEnvHttpHost=value` or `pageItem[readOnly.type] = cgiEnvHttpHost!=value` or `pageItem[readOnly.type] = item=value` or `pageItem[readOnly.type] = item!=value` or `pageItem[readOnly.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `pageItem[readOnly.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `pageItem[readOnly.type] = userPreference=value` or `pageItem[readOnly.type] = userPreference!=value` or `pageItem[readOnly.type] = textIsContainedInValue` or `pageItem[readOnly.type] = textIsNotContainedInValue` or `pageItem[readOnly.type] = text=value` or `pageItem[readOnly.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `pageItem[readOnly.type] = item=value` or `pageItem[readOnly.type] = item!=value` or `pageItem[readOnly.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `pageItem[readOnly.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `pageItem[readOnly.type] = itemIsNull` or `pageItem[readOnly.type] = itemIsNotNull` or `pageItem[readOnly.type] = itemIsZero` or `pageItem[readOnly.type] = itemIsNotZero` or `pageItem[readOnly.type] = itemIsNullOrZero` or `pageItem[readOnly.type] = itemIsNotNullAndNotZero` or `pageItem[readOnly.type] = itemContainsNoSpaces` or `pageItem[readOnly.type] = itemIsNumeric` or `pageItem[readOnly.type] = itemIsNotNumeric` or `pageItem[readOnly.type] = itemIsAlphanumeric` or `pageItem[readOnly.type] = itemIsInColonDelimitedList` or `pageItem[readOnly.type] = itemIsNotInColonDelimitedList` or `pageItem[readOnly.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[readOnly.type] = itemIsInColonDelimitedList` or `pageItem[readOnly.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `pageItem[readOnly.type] = userPreference=value` or `pageItem[readOnly.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `pageItem[readOnly.type] = currentPage=page` or `pageItem[readOnly.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `pageItem[readOnly.type] = currentPageInList` or `pageItem[readOnly.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[readOnly.type] = textIsContainedInItem` or `pageItem[readOnly.type] = textIsContainedInValue` or `pageItem[readOnly.type] = textIsNotContainedInValue` or `pageItem[readOnly.type] = text=value` or `pageItem[readOnly.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `pageItem[readOnly.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `pageItem[readOnly.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[readOnly.type] = expression` and `pageItem[readOnly.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[readOnly.type] = expression` and `pageItem[readOnly.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[readOnly.type] = expression` and `pageItem[readOnly.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[readOnly.type] = functionBody` and `pageItem[readOnly.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `pageItem[readOnly.type] = functionBody` and `pageItem[readOnly.language] = javaScript-mle`;

### genAI

- `enabled` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `agent` — `<@aiAgent>`; —; No; —; —; lovType=COMPONENT; `pageItem[genAI.enabled] = Y` or `pageItem[genAI.enabled] = Y`;
- `service` — `<@genAIService>`; —; No; —; —; lovType=COMPONENT; `pageItem[genAI.enabled] = Y` or `pageItem[genAI.enabled] = Y`;
- `systemPrompt` — `<STRING>`; —; No; —; —; —; `pageItem[genAI.enabled] = Y` or `pageItem[genAI.enabled] = Y`;
- `welcomeMessage` — `<STRING>`; —; No; —; —; —; `pageItem[genAI.enabled] = Y` or `pageItem[genAI.enabled] = Y`;

### cascadingLov

- `parentItems` — `<STRING>`; —; No; —; —; maxLength=255, textCase=UPPER; `pageItem[lov.type] = sample`;
- `itemsToSubmit` — `<STRING>`; —; No; —; —; maxLength=4000, textCase=UPPER; `pageItem[lov.type] = sample` and `pageItem[cascadingLov.parentItems] = sample`;
- `parentRequired` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `pageItem[lov.type] = sample` and `pageItem[cascadingLov.parentItems] = sample`;

