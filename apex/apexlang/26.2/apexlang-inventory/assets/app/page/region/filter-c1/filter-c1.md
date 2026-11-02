# filter

- componentType: `filter`
- identifierRequired: true
- appliesWhen: `region[identification.type] = smartFilters`

## Properties

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### identification (direct group)

- `type` — `<STRING>`; —; Yes; —; `<enum:[checkboxGroup, checkboxGroup, colorPicker, colorPicker, datePicker, datePicker, datePickerJquery, datePickerJquery, displayOnly, displayOnly, hidden, hidden, inputField, inputField, markdownEditor, markdownEditor, numberField, numberField, password, password, percentGraph, percentGraph, popupLov, popupLov, radioGroup, radioGroup, range, range, richTextEditor, richTextEditor, search, search, shuttle, shuttle, starRating, starRating, switch, switch, textField, textField, textFieldWithAutocomplete, textFieldWithAutocomplete, textarea, textarea]>`; —; —;
- `name` — `<STRING>`; —; Yes; `P#PAGE_ID#_NEW`; —; maxLength=255, textCase=UPPER; —;

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### lov

- `type` — `<STRING>`; —; No; —; `<enum:[sharedComponent:"Shared Component", sqlQuery:"SQL Query", staticValues:"Static Values", functionBody:"Function Body returning SQL Query", distinctValues:"Distinct Values"]>`; —; —;
- `includeNullOption` — `<BOOLEAN>`; —; Yes; `N`; —; —; `filter[lov.type] = sample`;
- `sortDirection` — `<STRING>`; —; Yes; `ASC`; `<enum:[asc:"Ascending", desc:"Descending"]>`; —; `filter[lov.type] = distinctValues`;
- `lov` — `<@lov>`; —; Yes; —; —; lovType=COMPONENT; `filter[lov.type] = sharedComponent`;
- `sqlQuery` — `<STRING>`; Enter the SQL query definition to populate this list of values. Generally list of value queries are of the form:  select [displayValue],        [returnValue]   from ...  where ...  order by ...  Each column selected must have a unique name or alias. Oracle recommends using an alias on any column that includes an SQL expression. Note: When defining a Popup LOV item type, if you would like to display multiple columns in the popup, you must instead define your List of Values in Shared Components, with the required additional metadata. Inline list of values can only be used to display single columns for Popup LOVs.; Yes; —; —; maxLength=4000; `filter[lov.type] = sqlQuery`;
- `staticValues` — `<STRING>`; —; Yes; `STATIC:Display1\;Return1,Display2\;Return2`; —; maxLength=4000; `filter[lov.type] = staticValues`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `filter[lov.type] = functionBody`;
- `nullDisplayValue` — `<STRING>`; Enter the text to be displayed within the list NULL option at the top of this list.; Yes; —; —; maxLength=255; `filter[lov.type] = sample` and `filter[lov.includeNullOption] = Y`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `filter[lov.type] = functionBody` and `filter[lov.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `filter[lov.type] = functionBody` and `filter[lov.language] = javaScript-mle`;

### listEntries

- `computeCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `allowToExclude` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `filter[identification.type] = checkboxGroup` or `filter[identification.type] = radioGroup` or `filter[identification.type] = range`;
- `showCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `filter[listEntries.computeCounts] = Y`;
- `zeroCountEntries` — `<STRING>`; —; Yes; `H`; `<enum:[hide:"Hide", disable:"Disable", showLast:"Show Last"]>`; —; `filter[listEntries.computeCounts] = Y`;
- `showSelectedFirst` — `<BOOLEAN>`; —; Yes; `N`; —; —; `filter[lov.type] = sample`;
- `clientSideFiltering` — `<BOOLEAN>`; —; Yes; `N`; —; —; `filter[lov.type] = sample`;
- `sortByTopCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `filter[listEntries.computeCounts] = Y` and `filter[listEntries.showCounts] = Y` and `filter[identification.type] = checkboxGroup` or `filter[listEntries.computeCounts] = Y` and `filter[listEntries.showCounts] = Y` and `filter[identification.type] = radioGroup`;

### source

- `dbColumns` — `<STRING>`; —; No; —; —; maxLength=4000; `filter[identification.type] = search`;
- `databaseColumn` — `<STRING>`; Enter the case sensitive database column name used as the source for this filter.; Yes; —; —; maxLength=128; —;
- `dataType` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[varchar2:"VARCHAR2", number:"NUMBER", date:"DATE", timestamp:"TIMESTAMP", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", intervalYearToMonth:"INTERVAL YEAR TO MONTH", intervalDayToSecond:"INTERVAL DAY TO SECOND", clob:"CLOB", blob:"BLOB", boolean:"BOOLEAN", rowid:"ROWID", bfile:"BFILE", sdoGeometry:"SDO_GEOMETRY"]>`; maxLength=128; —;

### multipleValues

- `type` — `<STRING>`; —; No; —; `<enum:[delimitedList:"Delimited List", jsonArray:"JSON Array"]>`; —; `filter[identification.type] = checkboxGroup` or `filter[identification.type] = radioGroup` or `filter[identification.type] = NATIVE_SELECT_LIST`;
- `trimWhitespace` — `<BOOLEAN>`; —; Yes; `N`; —; —; `filter[identification.type] = checkboxGroup` and `filter[multipleValues.type] = delimitedList` or `filter[identification.type] = radioGroup` and `filter[multipleValues.type] = delimitedList` or `filter[identification.type] = NATIVE_SELECT_LIST` and `filter[multipleValues.type] = delimitedList`;
- `filterCombination` — `<STRING>`; —; Yes; `OR`; `<enum:[or:"OR (Union)", and:"AND (Intersect)"]>`; —; `filter[identification.type] = checkboxGroup` and `filter[multipleValues.type] = sample` or `filter[identification.type] = radioGroup` and `filter[multipleValues.type] = sample` or `filter[identification.type] = NATIVE_SELECT_LIST` and `filter[multipleValues.type] = sample`;
- `separator` — `<STRING>`; —; Yes; `:`; —; maxLength=5; `filter[identification.type] = checkboxGroup` and `filter[multipleValues.type] = delimitedList` or `filter[identification.type] = radioGroup` and `filter[multipleValues.type] = delimitedList` or `filter[identification.type] = NATIVE_SELECT_LIST` and `filter[multipleValues.type] = delimitedList`;

### suggestions

- `type` — `<STRING>`; —; No; —; `<enum:[dynamic:"Dynamic", staticValues:"Static Values", sqlQuery:"SQL Query"]>`; —; —;
- `staticValues` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[suggestions.type] = staticValues`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[suggestions.type] = sqlQuery`;
- `showLabel` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `filter[suggestions.type] = sample`;

### dependingOn

- `filter` — `<@filter>`; —; No; —; —; lovType=COMPONENT; —;
- `type` — `<STRING>`; —; Yes; `NOT_NULL`; `<enum:[=:"equal to", !=:"not equal to", inList:"in list", notInList:"not in list", isNull:"is null", isNotNull:"is not null"]>`; —; `filter[dependingOn.filter] = sample`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[dependingOn.filter] = sample` and `filter[dependingOn.type] = =` or `filter[dependingOn.filter] = sample` and `filter[dependingOn.type] = !=`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[dependingOn.filter] = sample` and `filter[dependingOn.type] = inList` or `filter[dependingOn.filter] = sample` and `filter[dependingOn.type] = notInList`;

### appearance

- `valuePlaceholder` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `icon` — `<STRING>`; Enter the classes for the icon you want to use to identify this filter. You may add multiple classes by separating them with spaces.             If your theme uses Font APEX then review the Universal Theme Sample Application to view available icons and modifiers.; No; —; —; maxLength=255; —;
- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; `filter[source.dataType] = date` or `filter[source.dataType] = timestamp` or `filter[source.dataType] = timestampWithTimeZone` or `filter[source.dataType] = timestampWithLocalTimeZone`;

### advanced

- `cssClasses` — `<STRING>`; Enter classes to add to this filter. You may add multiple classes by separating them with spaces.; No; —; —; maxLength=255; —;

### default

- `type` — `<STRING>`; —; No; —; `<enum:[static:"Static", item:"Item", sqlQuerySingleValue:"SQL Query (return single value)", sqlQueryMultipleValues:"SQL Query (return multiple values)", expression:"Expression", functionBody:"Function Body", sequence:"Sequence"]>`; —; —;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[default.type] = static`;
- `item` — `<STRING>`; —; Yes; —; —; textCase=UPPER; `filter[default.type] = item`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `filter[default.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `filter[default.type] = functionBody`;
- `sqlQuerySingleValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[default.type] = sqlQuerySingleValue`;
- `sqlQueryMultipleValues` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[default.type] = sqlQueryMultipleValues`;
- `sequence` — `<STRING>`; —; Yes; —; —; maxLength=128; `filter[default.type] = sequence`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[default.type] = expression` and `filter[default.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[default.type] = expression` and `filter[default.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[default.type] = expression` and `filter[default.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[default.type] = functionBody` and `filter[default.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[default.type] = functionBody` and `filter[default.language] = javaScript-mle`;

### security

- `encryptSessionState` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `escapeSpecialChars` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[serverSideCondition.type] = rowsReturned` or `filter[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[serverSideCondition.type] = request=Value` or `filter[serverSideCondition.type] = request!=Value` or `filter[serverSideCondition.type] = requestIsContainedInValue` or `filter[serverSideCondition.type] = requestIsNotContainedInValue` or `filter[serverSideCondition.type] = currentLanguageIsContainedInValue` or `filter[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `filter[serverSideCondition.type] = currentLanguage!=value` or `filter[serverSideCondition.type] = currentLanguage=value` or `filter[serverSideCondition.type] = cgiEnvDadName=value` or `filter[serverSideCondition.type] = cgiEnvDadName!=value` or `filter[serverSideCondition.type] = cgiEnvServerName=value` or `filter[serverSideCondition.type] = cgiEnvServerName!=value` or `filter[serverSideCondition.type] = cgiEnvHttpHost=value` or `filter[serverSideCondition.type] = cgiEnvHttpHost!=value` or `filter[serverSideCondition.type] = item=value` or `filter[serverSideCondition.type] = item!=value` or `filter[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `filter[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `filter[serverSideCondition.type] = textIsContainedInValue` or `filter[serverSideCondition.type] = textIsNotContainedInValue` or `filter[serverSideCondition.type] = text=value` or `filter[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `filter[serverSideCondition.type] = item=value` or `filter[serverSideCondition.type] = item!=value` or `filter[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `filter[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `filter[serverSideCondition.type] = itemIsNull` or `filter[serverSideCondition.type] = itemIsNotNull` or `filter[serverSideCondition.type] = itemIsZero` or `filter[serverSideCondition.type] = itemIsNotZero` or `filter[serverSideCondition.type] = itemIsNullOrZero` or `filter[serverSideCondition.type] = itemIsNotNullAndNotZero` or `filter[serverSideCondition.type] = itemContainsNoSpaces` or `filter[serverSideCondition.type] = itemIsNumeric` or `filter[serverSideCondition.type] = itemIsNotNumeric` or `filter[serverSideCondition.type] = itemIsAlphanumeric` or `filter[serverSideCondition.type] = itemIsInColonDelimitedList` or `filter[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `filter[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[serverSideCondition.type] = itemIsInColonDelimitedList` or `filter[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `filter[serverSideCondition.type] = userPreference=value` or `filter[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `filter[serverSideCondition.type] = currentPage=page` or `filter[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `filter[serverSideCondition.type] = currentPageInList` or `filter[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[serverSideCondition.type] = textIsContainedInItem` or `filter[serverSideCondition.type] = textIsContainedInValue` or `filter[serverSideCondition.type] = textIsNotContainedInValue` or `filter[serverSideCondition.type] = text=value` or `filter[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `filter[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `filter[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[serverSideCondition.type] = expression` and `filter[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[serverSideCondition.type] = expression` and `filter[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[serverSideCondition.type] = expression` and `filter[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[serverSideCondition.type] = functionBody` and `filter[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `filter[serverSideCondition.type] = functionBody` and `filter[serverSideCondition.language] = javaScript-mle`;

### label

- `label` — `<STRING>`; Enter the label for the filter.     The label displays on the page only if the filter displays. The label for type Search is visually hidden, but available to assistive technology.; No; —; —; maxLength=4000; —;

### cascadingLov

- `parentFilter` — `<STRING>`; —; No; —; —; textCase=UPPER; `filter[lov.type] = sharedComponent`;
- `lovColumn` — `<STRING>`; —; Yes; —; —; maxLength=128; `filter[lov.type] = sharedComponent` and `filter[cascadingLov.parentFilter] = sample`;
- `parentRequired` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `filter[lov.type] = sharedComponent` and `filter[cascadingLov.parentFilter] = sample`;

