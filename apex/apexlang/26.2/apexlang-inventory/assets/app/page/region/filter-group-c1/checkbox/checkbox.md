# checkbox

- componentType: `checkbox`
- identifierRequired: true
- appliesWhen: `region[identification.type] = smartFilters`

## Properties

### layout

- `filterGroup` — `<@filterGroup>`; —; Yes; —; —; lovType=COMPONENT; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;
- `encryptSessionState` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `escapeSpecialChars` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[serverSideCondition.type] = rowsReturned` or `checkbox[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[serverSideCondition.type] = request=Value` or `checkbox[serverSideCondition.type] = request!=Value` or `checkbox[serverSideCondition.type] = requestIsContainedInValue` or `checkbox[serverSideCondition.type] = requestIsNotContainedInValue` or `checkbox[serverSideCondition.type] = currentLanguageIsContainedInValue` or `checkbox[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `checkbox[serverSideCondition.type] = currentLanguage!=value` or `checkbox[serverSideCondition.type] = currentLanguage=value` or `checkbox[serverSideCondition.type] = cgiEnvDadName=value` or `checkbox[serverSideCondition.type] = cgiEnvDadName!=value` or `checkbox[serverSideCondition.type] = cgiEnvServerName=value` or `checkbox[serverSideCondition.type] = cgiEnvServerName!=value` or `checkbox[serverSideCondition.type] = cgiEnvHttpHost=value` or `checkbox[serverSideCondition.type] = cgiEnvHttpHost!=value` or `checkbox[serverSideCondition.type] = item=value` or `checkbox[serverSideCondition.type] = item!=value` or `checkbox[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `checkbox[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `checkbox[serverSideCondition.type] = textIsContainedInValue` or `checkbox[serverSideCondition.type] = textIsNotContainedInValue` or `checkbox[serverSideCondition.type] = text=value` or `checkbox[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `checkbox[serverSideCondition.type] = item=value` or `checkbox[serverSideCondition.type] = item!=value` or `checkbox[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `checkbox[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `checkbox[serverSideCondition.type] = itemIsNull` or `checkbox[serverSideCondition.type] = itemIsNotNull` or `checkbox[serverSideCondition.type] = itemIsZero` or `checkbox[serverSideCondition.type] = itemIsNotZero` or `checkbox[serverSideCondition.type] = itemIsNullOrZero` or `checkbox[serverSideCondition.type] = itemIsNotNullAndNotZero` or `checkbox[serverSideCondition.type] = itemContainsNoSpaces` or `checkbox[serverSideCondition.type] = itemIsNumeric` or `checkbox[serverSideCondition.type] = itemIsNotNumeric` or `checkbox[serverSideCondition.type] = itemIsAlphanumeric` or `checkbox[serverSideCondition.type] = itemIsInColonDelimitedList` or `checkbox[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `checkbox[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[serverSideCondition.type] = itemIsInColonDelimitedList` or `checkbox[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `checkbox[serverSideCondition.type] = userPreference=value` or `checkbox[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `checkbox[serverSideCondition.type] = currentPage=page` or `checkbox[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `checkbox[serverSideCondition.type] = currentPageInList` or `checkbox[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[serverSideCondition.type] = textIsContainedInItem` or `checkbox[serverSideCondition.type] = textIsContainedInValue` or `checkbox[serverSideCondition.type] = textIsNotContainedInValue` or `checkbox[serverSideCondition.type] = text=value` or `checkbox[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `checkbox[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `checkbox[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[serverSideCondition.type] = expression` and `checkbox[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[serverSideCondition.type] = expression` and `checkbox[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[serverSideCondition.type] = expression` and `checkbox[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[serverSideCondition.type] = functionBody` and `checkbox[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[serverSideCondition.type] = functionBody` and `checkbox[serverSideCondition.language] = javaScript-mle`;

### identification (direct group)

- `type` — `<STRING>`; —; Yes; —; `<enum:[checkbox:"Checkbox", checkbox:"Checkbox", colorPicker:"Color Picker", colorPicker:"Color Picker", datePicker:"Date Picker", datePicker:"Date Picker", datePickerJquery:"Date Picker (jQuery)", datePickerJquery:"Date Picker (jQuery)", displayOnly:"Display Only", displayOnly:"Display Only", hidden:"Hidden", hidden:"Hidden", markdownEditor:"Markdown Editor", markdownEditor:"Markdown Editor", numberField:"Number Field", numberField:"Number Field", password:"Password", password:"Password", percentGraph:"Percent Graph", percentGraph:"Percent Graph", popupLov:"Popup LOV", popupLov:"Popup LOV", richTextEditor:"Rich Text Editor", richTextEditor:"Rich Text Editor", shuttle:"Shuttle", shuttle:"Shuttle", starRating:"Star Rating", starRating:"Star Rating", switch:"Switch", switch:"Switch", textField:"Text Field", textField:"Text Field", textFieldWithAutocomplete:"Text Field with autocomplete", textFieldWithAutocomplete:"Text Field with autocomplete", textarea:"Textarea", textarea:"Textarea"]>`; —; —;
- `name` — `<STRING>`; —; Yes; `P#PAGE_ID#_NEW`; —; maxLength=255, textCase=UPPER; —;

### lov

- `type` — `<STRING>`; —; No; —; `<enum:[sharedComponent:"Shared Component", sqlQuery:"SQL Query", staticValues:"Static Values", functionBody:"Function Body returning SQL Query", distinctValues:"Distinct Values"]>`; —; —;
- `includeNullOption` — `<BOOLEAN>`; —; Yes; `N`; —; —; `checkbox[lov.type] = sample`;
- `sortDirection` — `<STRING>`; —; Yes; `ASC`; `<enum:[asc:"Ascending", desc:"Descending"]>`; —; `checkbox[lov.type] = distinctValues`;
- `lov` — `<@lov>`; —; Yes; —; —; lovType=COMPONENT; `checkbox[lov.type] = sharedComponent`;
- `sqlQuery` — `<STRING>`; Enter the SQL query definition to populate this list of values. Generally list of value queries are of the form:  select [displayValue],        [returnValue]   from ...  where ...  order by ...  Each column selected must have a unique name or alias. Oracle recommends using an alias on any column that includes an SQL expression. Note: When defining a Popup LOV item type, if you would like to display multiple columns in the popup, you must instead define your List of Values in Shared Components, with the required additional metadata. Inline list of values can only be used to display single columns for Popup LOVs.; Yes; —; —; maxLength=4000; `checkbox[lov.type] = sqlQuery`;
- `staticValues` — `<STRING>`; —; Yes; `STATIC:Display1\;Return1,Display2\;Return2`; —; maxLength=4000; `checkbox[lov.type] = staticValues`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `checkbox[lov.type] = functionBody`;
- `nullDisplayValue` — `<STRING>`; Enter the text to be displayed within the list NULL option at the top of this list.; Yes; —; —; maxLength=255; `checkbox[lov.type] = sample` and `checkbox[lov.includeNullOption] = Y`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `checkbox[lov.type] = functionBody` and `checkbox[lov.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `checkbox[lov.type] = functionBody` and `checkbox[lov.language] = javaScript-mle`;

### dependingOn

- `checkbox` — `<@checkbox>`; —; No; —; —; lovType=COMPONENT; —;
- `type` — `<STRING>`; —; Yes; `NOT_NULL`; `<enum:[=:"equal to", !=:"not equal to", inList:"in list", notInList:"not in list", isNull:"is null", isNotNull:"is not null"]>`; —; `checkbox[dependingOn.checkbox] = sample`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[dependingOn.checkbox] = sample` and `checkbox[dependingOn.type] = =` or `checkbox[dependingOn.checkbox] = sample` and `checkbox[dependingOn.type] = !=`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[dependingOn.checkbox] = sample` and `checkbox[dependingOn.type] = inList` or `checkbox[dependingOn.checkbox] = sample` and `checkbox[dependingOn.type] = notInList`;

### appearance

- `valuePlaceholder` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `icon` — `<STRING>`; Enter the classes for the icon you want to use to identify this filter. You may add multiple classes by separating them with spaces.             If your theme uses Font APEX then review the Universal Theme Sample Application to view available icons and modifiers.; No; —; —; maxLength=255; —;
- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; `checkbox[source.dataType] = date` or `checkbox[source.dataType] = timestamp` or `checkbox[source.dataType] = timestampWithTimeZone` or `checkbox[source.dataType] = timestampWithLocalTimeZone`;

### source

- `databaseColumn` — `<STRING>`; Enter the case sensitive database column name used as the source for this filter.; Yes; —; —; maxLength=128; —;
- `dataType` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[varchar2:"VARCHAR2", number:"NUMBER", date:"DATE", timestamp:"TIMESTAMP", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", intervalYearToMonth:"INTERVAL YEAR TO MONTH", intervalDayToSecond:"INTERVAL DAY TO SECOND", clob:"CLOB", blob:"BLOB", boolean:"BOOLEAN", rowid:"ROWID", bfile:"BFILE", sdoGeometry:"SDO_GEOMETRY"]>`; maxLength=128; —;

### default

- `type` — `<STRING>`; —; No; —; `<enum:[static:"Static", item:"Item", sqlQuerySingleValue:"SQL Query (return single value)", sqlQueryMultipleValues:"SQL Query (return multiple values)", expression:"Expression", functionBody:"Function Body", sequence:"Sequence"]>`; —; —;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[default.type] = static`;
- `item` — `<STRING>`; —; Yes; —; —; textCase=UPPER; `checkbox[default.type] = item`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `checkbox[default.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `checkbox[default.type] = functionBody`;
- `sqlQuerySingleValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[default.type] = sqlQuerySingleValue`;
- `sqlQueryMultipleValues` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[default.type] = sqlQueryMultipleValues`;
- `sequence` — `<STRING>`; —; Yes; —; —; maxLength=128; `checkbox[default.type] = sequence`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[default.type] = expression` and `checkbox[default.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[default.type] = expression` and `checkbox[default.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[default.type] = expression` and `checkbox[default.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[default.type] = functionBody` and `checkbox[default.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `checkbox[default.type] = functionBody` and `checkbox[default.language] = javaScript-mle`;

### label

- `label` — `<STRING>`; Enter the label for the filter.     The label displays on the page only if the filter displays. The label for type Search is visually hidden, but available to assistive technology.; No; —; —; maxLength=4000; —;

### cascadingLov

- `parentFilter` — `<STRING>`; —; No; —; —; textCase=UPPER; `checkbox[lov.type] = sharedComponent`;
- `lovColumn` — `<STRING>`; —; Yes; —; —; maxLength=128; `checkbox[lov.type] = sharedComponent` and `checkbox[cascadingLov.parentFilter] = sample`;
- `parentRequired` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `checkbox[lov.type] = sharedComponent` and `checkbox[cascadingLov.parentFilter] = sample`;

