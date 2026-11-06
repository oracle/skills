# plugin-variants/checkboxGroup

- componentType: `facet`
- identifierRequired: true
- appliesWhen: `region[identification.type] = facetedSearch`

## Properties

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
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[serverSideCondition.type] = rowsReturned` or `facet[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[serverSideCondition.type] = request=Value` or `facet[serverSideCondition.type] = request!=Value` or `facet[serverSideCondition.type] = requestIsContainedInValue` or `facet[serverSideCondition.type] = requestIsNotContainedInValue` or `facet[serverSideCondition.type] = currentLanguageIsContainedInValue` or `facet[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `facet[serverSideCondition.type] = currentLanguage!=value` or `facet[serverSideCondition.type] = currentLanguage=value` or `facet[serverSideCondition.type] = cgiEnvDadName=value` or `facet[serverSideCondition.type] = cgiEnvDadName!=value` or `facet[serverSideCondition.type] = cgiEnvServerName=value` or `facet[serverSideCondition.type] = cgiEnvServerName!=value` or `facet[serverSideCondition.type] = cgiEnvHttpHost=value` or `facet[serverSideCondition.type] = cgiEnvHttpHost!=value` or `facet[serverSideCondition.type] = item=value` or `facet[serverSideCondition.type] = item!=value` or `facet[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `facet[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `facet[serverSideCondition.type] = textIsContainedInValue` or `facet[serverSideCondition.type] = textIsNotContainedInValue` or `facet[serverSideCondition.type] = text=value` or `facet[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `facet[serverSideCondition.type] = item=value` or `facet[serverSideCondition.type] = item!=value` or `facet[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `facet[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `facet[serverSideCondition.type] = itemIsNull` or `facet[serverSideCondition.type] = itemIsNotNull` or `facet[serverSideCondition.type] = itemIsZero` or `facet[serverSideCondition.type] = itemIsNotZero` or `facet[serverSideCondition.type] = itemIsNullOrZero` or `facet[serverSideCondition.type] = itemIsNotNullAndNotZero` or `facet[serverSideCondition.type] = itemContainsNoSpaces` or `facet[serverSideCondition.type] = itemIsNumeric` or `facet[serverSideCondition.type] = itemIsNotNumeric` or `facet[serverSideCondition.type] = itemIsAlphanumeric` or `facet[serverSideCondition.type] = itemIsInColonDelimitedList` or `facet[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `facet[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[serverSideCondition.type] = itemIsInColonDelimitedList` or `facet[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `facet[serverSideCondition.type] = userPreference=value` or `facet[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `facet[serverSideCondition.type] = currentPage=page` or `facet[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `facet[serverSideCondition.type] = currentPageInList` or `facet[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[serverSideCondition.type] = textIsContainedInItem` or `facet[serverSideCondition.type] = textIsContainedInValue` or `facet[serverSideCondition.type] = textIsNotContainedInValue` or `facet[serverSideCondition.type] = text=value` or `facet[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `facet[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `facet[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[serverSideCondition.type] = expression` and `facet[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[serverSideCondition.type] = expression` and `facet[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[serverSideCondition.type] = expression` and `facet[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[serverSideCondition.type] = functionBody` and `facet[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[serverSideCondition.type] = functionBody` and `facet[serverSideCondition.language] = javaScript-mle`;

### identification (direct group)

- `type` — `<STRING>`; —; Yes; —; `<enum:[checkboxGroup:"Checkbox Group"]>`; —; —;
- `name` — `<STRING>`; —; Yes; `P#PAGE_ID#_NEW`; —; maxLength=255, textCase=UPPER; —;

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `maxHeight` — `<INTEGER>`; —; No; —; —; —; —;

### lov

- `type` — `<STRING>`; —; No; —; `<enum:[sharedComponent:"Shared Component", sqlQuery:"SQL Query", staticValues:"Static Values", functionBody:"Function Body returning SQL Query", distinctValues:"Distinct Values"]>`; —; —;
- `includeNullOption` — `<BOOLEAN>`; —; Yes; `N`; —; —; `facet[lov.type] = sample`;
- `sortDirection` — `<STRING>`; —; Yes; `ASC`; `<enum:[asc:"Ascending", desc:"Descending"]>`; —; `facet[lov.type] = distinctValues`;
- `lov` — `<@lov>`; —; Yes; —; —; lovType=COMPONENT; `facet[lov.type] = sharedComponent`;
- `sqlQuery` — `<STRING>`; Enter the SQL query definition to populate this list of values. Generally list of value queries are of the form:  select [displayValue],        [returnValue]   from ...  where ...  order by ...  Each column selected must have a unique name or alias. Oracle recommends using an alias on any column that includes an SQL expression. Note: When defining a Popup LOV item type, if you would like to display multiple columns in the popup, you must instead define your List of Values in Shared Components, with the required additional metadata. Inline list of values can only be used to display single columns for Popup LOVs.; Yes; —; —; maxLength=4000; `facet[lov.type] = sqlQuery`;
- `staticValues` — `<STRING>`; —; Yes; `STATIC:Display1\;Return1,Display2\;Return2`; —; maxLength=4000; `facet[lov.type] = staticValues`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `facet[lov.type] = functionBody`;
- `nullDisplayValue` — `<STRING>`; Enter the text to be displayed within the list NULL option at the top of this list.; Yes; —; —; maxLength=255; `facet[lov.type] = sample` and `facet[lov.includeNullOption] = Y`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `facet[lov.type] = functionBody` and `facet[lov.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `facet[lov.type] = functionBody` and `facet[lov.language] = javaScript-mle`;

### listEntries

- `computeCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `allowToExclude` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `facet[identification.type] = NATIVE_CHECKBOX` or `facet[identification.type] = NATIVE_RADIOGROUP` or `facet[identification.type] = NATIVE_RANGE`;
- `showCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `facet[listEntries.computeCounts] = Y`;
- `zeroCountEntries` — `<STRING>`; —; Yes; `H`; `<enum:[hide:"Hide", disable:"Disable", showLast:"Show Last"]>`; —; `facet[listEntries.computeCounts] = Y`;
- `displayFilterInitially` — `<BOOLEAN>`; —; Yes; `N`; —; —; `facet[lov.type] = sample`;
- `showSelectedFirst` — `<BOOLEAN>`; —; Yes; `N`; —; —; `facet[lov.type] = sample`;
- `maxDisplayedEntries` — `<INTEGER>`; —; No; —; —; —; `facet[lov.type] = sample`;
- `sortByTopCounts` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `facet[listEntries.computeCounts] = Y` and `facet[listEntries.showCounts] = Y` and `facet[identification.type] = NATIVE_CHECKBOX` or `facet[listEntries.computeCounts] = Y` and `facet[listEntries.showCounts] = Y` and `facet[identification.type] = NATIVE_RADIOGROUP`;

### source

- `dbColumns` — `<STRING>`; —; No; —; —; maxLength=4000; `facet[identification.type] = NATIVE_SEARCH`;
- `databaseColumn` — `<STRING>`; Enter the case sensitive database column name used as the source for this facet.; Yes; —; —; maxLength=128; —;
- `dataType` — `<STRING>`; —; Yes; `VARCHAR2`; `<enum:[varchar2:"VARCHAR2", number:"NUMBER", date:"DATE", timestamp:"TIMESTAMP", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", intervalYearToMonth:"INTERVAL YEAR TO MONTH", intervalDayToSecond:"INTERVAL DAY TO SECOND", clob:"CLOB", blob:"BLOB", boolean:"BOOLEAN", rowid:"ROWID", bfile:"BFILE", sdoGeometry:"SDO_GEOMETRY"]>`; maxLength=128; —;

### dependingOn

- `facet` — `<@facet>`; —; No; —; —; lovType=COMPONENT; —;
- `type` — `<STRING>`; —; Yes; `NOT_NULL`; `<enum:[=:"equal to", !=:"not equal to", inList:"in list", notInList:"not in list", isNull:"is null", isNotNull:"is not null"]>`; —; `facet[dependingOn.facet] = sample`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[dependingOn.facet] = sample` and `facet[dependingOn.type] = =` or `facet[dependingOn.facet] = sample` and `facet[dependingOn.type] = !=`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[dependingOn.facet] = sample` and `facet[dependingOn.type] = inList` or `facet[dependingOn.facet] = sample` and `facet[dependingOn.type] = notInList`;

### appearance

- `display` — `<STRING>`; —; Yes; `INLINE`; `<enum:[inline:"Inline", addFilterDialog:"Add Filter Dialog"]>`; —; —;
- `valuePlaceholder` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `icon` — `<STRING>`; Enter the classes for the icon you want to use to identify this facet. You may add multiple classes by separating them with spaces.             If your theme uses Font APEX then review the Universal Theme Sample Application to view available icons and modifiers.; No; —; —; maxLength=255; —;
- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; `facet[source.dataType] = date` or `facet[source.dataType] = timestamp` or `facet[source.dataType] = timestampWithTimeZone` or `facet[source.dataType] = timestampWithLocalTimeZone`;

### multipleValues

- `type` — `<STRING>`; —; No; —; `<enum:[delimitedList:"Delimited List", jsonArray:"JSON Array"]>`; —; `facet[identification.type] = NATIVE_CHECKBOX` or `facet[identification.type] = NATIVE_RADIOGROUP` or `facet[identification.type] = NATIVE_SELECT_LIST`;
- `trimWhitespace` — `<BOOLEAN>`; —; Yes; `N`; —; —; `facet[identification.type] = NATIVE_CHECKBOX` and `facet[multipleValues.type] = delimitedList` or `facet[identification.type] = NATIVE_RADIOGROUP` and `facet[multipleValues.type] = delimitedList` or `facet[identification.type] = NATIVE_SELECT_LIST` and `facet[multipleValues.type] = delimitedList`;
- `filterCombination` — `<STRING>`; —; Yes; `OR`; `<enum:[or:"OR (Union)", and:"AND (Intersect)"]>`; —; `facet[identification.type] = NATIVE_CHECKBOX` and `facet[multipleValues.type] = sample` or `facet[identification.type] = NATIVE_RADIOGROUP` and `facet[multipleValues.type] = sample` or `facet[identification.type] = NATIVE_SELECT_LIST` and `facet[multipleValues.type] = sample`;
- `separator` — `<STRING>`; —; Yes; `:`; —; maxLength=5; `facet[identification.type] = NATIVE_CHECKBOX` and `facet[multipleValues.type] = delimitedList` or `facet[identification.type] = NATIVE_RADIOGROUP` and `facet[multipleValues.type] = delimitedList` or `facet[identification.type] = NATIVE_SELECT_LIST` and `facet[multipleValues.type] = delimitedList`;

### label

- `showLabelForCurrentFacet` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `label` — `<STRING>`; Enter the label for the facet.     The label displays on the page only if the facet displays. The label for type Search is visually hidden, but available to assistive technology.; No; —; —; maxLength=4000; —;

### default

- `type` — `<STRING>`; —; No; —; `<enum:[static:"Static", item:"Item", sqlQuerySingleValue:"SQL Query (return single value)", sqlQueryMultipleValues:"SQL Query (return multiple values)", expression:"Expression", functionBody:"Function Body", sequence:"Sequence"]>`; —; —;
- `staticValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[default.type] = static`;
- `item` — `<STRING>`; —; Yes; —; —; textCase=UPPER; `facet[default.type] = item`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `facet[default.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `facet[default.type] = functionBody`;
- `sqlQuerySingleValue` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[default.type] = sqlQuerySingleValue`;
- `sqlQueryMultipleValues` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[default.type] = sqlQueryMultipleValues`;
- `sequence` — `<STRING>`; —; Yes; —; —; maxLength=128; `facet[default.type] = sequence`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[default.type] = expression` and `facet[default.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[default.type] = expression` and `facet[default.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[default.type] = expression` and `facet[default.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[default.type] = functionBody` and `facet[default.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `facet[default.type] = functionBody` and `facet[default.language] = javaScript-mle`;

### advanced

- `collapsible` — `<BOOLEAN>`; —; Yes; `N`; —; —; `facet[appearance.display] = inline`;
- `cssClasses` — `<STRING>`; Enter classes to add to this facet. You may add multiple classes by separating them with spaces.; No; —; —; maxLength=255; `facet[appearance.display] = inline`;
- `initiallyCollapsed` — `<BOOLEAN>`; —; Yes; `N`; —; —; `facet[appearance.display] = inline` and `facet[advanced.collapsible] = Y`;
- `showChartInitially` — `<BOOLEAN>`; —; Yes; `N`; —; —; `facet[listEntries.computeCounts] = Y` and `facet[lov.type] = sample` and `facet[actionsMenu.chart] = Y` and `facet[appearance.display] = inline`;

### cascadingLov

- `parentFacet` — `<STRING>`; —; No; —; —; textCase=UPPER; `facet[lov.type] = sharedComponent`;
- `lovColumn` — `<STRING>`; —; Yes; —; —; maxLength=128; `facet[lov.type] = sharedComponent` and `facet[cascadingLov.parentFacet] = sample`;
- `parentRequired` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `facet[lov.type] = sharedComponent` and `facet[cascadingLov.parentFacet] = sample`;

### actionsMenu

- `chart` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `facet[listEntries.computeCounts] = Y` and `facet[lov.type] = sample`;
- `filter` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `facet[lov.type] = sample` and `facet[appearance.display] = inline`;

