# column

- componentType: `column`
- identifierRequired: true
- appliesWhen: `region[source.location] = localDatabase`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=128, textCase=UPPER; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[always, rowsReturned, noRowsReturned, expression, functionBody, request=Value, request!=Value, requestIsContainedInValue, requestIsNotContainedInValue, item=value, item!=value, itemIsNull, itemIsNotNull, itemIsZero, itemIsNotZero, itemIsNullOrZero, itemIsNotNullAndNotZero, itemContainsNoSpaces, itemIsNumeric, itemIsNotNumeric, itemIsAlphanumeric, itemIsInColonDelimitedList, itemIsNotInColonDelimitedList, textIsContainedInItem, text=value, text!=value, textIsContainedInValue, textIsNotContainedInValue, userPreference=value, userPreference!=value, currentPage=page, currentPage!=page, currentPageInList, currentPageNotInList, currentPage=pageSubmitted, currentPage!=pageSubmitted, currentPageIsInPrinterFriendlyMode, currentPageIsNotInPrinterFriendlyMode, pageRegionIsReadOnly, pageRegionIsNotReadOnly, userIsAuthenticated, userIsPublicUser, inlineValidationErrorsDisplayed, inlineValidationErrorsNotDisplayed, sqlReportsOkToShowForwardButton, sqlReportsOkToShowBackButton, currentLanguage=value, currentLanguage!=value, currentLanguageIsContainedInValue, currentLanguageIsNotContainedInValue, clientBrowserIsMozilla, clientBrowserIsIE7higher, clientBrowserIsXhtmlCssCapable, clientBrowserIsOther, cgiEnvDadName=value, cgiEnvDadName!=value, cgiEnvServerName=value, cgiEnvServerName!=value, cgiEnvHttpHost=value, cgiEnvHttpHost!=value, never]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[serverSideCondition.type] = rowsReturned` or `column[serverSideCondition.type] = noRowsReturned`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[serverSideCondition.type] = request=Value` or `column[serverSideCondition.type] = request!=Value` or `column[serverSideCondition.type] = requestIsContainedInValue` or `column[serverSideCondition.type] = requestIsNotContainedInValue` or `column[serverSideCondition.type] = currentLanguageIsContainedInValue` or `column[serverSideCondition.type] = currentLanguageIsNotContainedInValue` or `column[serverSideCondition.type] = currentLanguage!=value` or `column[serverSideCondition.type] = currentLanguage=value` or `column[serverSideCondition.type] = cgiEnvDadName=value` or `column[serverSideCondition.type] = cgiEnvDadName!=value` or `column[serverSideCondition.type] = cgiEnvServerName=value` or `column[serverSideCondition.type] = cgiEnvServerName!=value` or `column[serverSideCondition.type] = cgiEnvHttpHost=value` or `column[serverSideCondition.type] = cgiEnvHttpHost!=value` or `column[serverSideCondition.type] = item=value` or `column[serverSideCondition.type] = item!=value` or `column[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `column[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `column[serverSideCondition.type] = textIsContainedInValue` or `column[serverSideCondition.type] = textIsNotContainedInValue` or `column[serverSideCondition.type] = text=value` or `column[serverSideCondition.type] = text!=value`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `column[serverSideCondition.type] = item=value` or `column[serverSideCondition.type] = item!=value` or `column[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `column[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `column[serverSideCondition.type] = itemIsNull` or `column[serverSideCondition.type] = itemIsNotNull` or `column[serverSideCondition.type] = itemIsZero` or `column[serverSideCondition.type] = itemIsNotZero` or `column[serverSideCondition.type] = itemIsNullOrZero` or `column[serverSideCondition.type] = itemIsNotNullAndNotZero` or `column[serverSideCondition.type] = itemContainsNoSpaces` or `column[serverSideCondition.type] = itemIsNumeric` or `column[serverSideCondition.type] = itemIsNotNumeric` or `column[serverSideCondition.type] = itemIsAlphanumeric` or `column[serverSideCondition.type] = itemIsInColonDelimitedList` or `column[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `column[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[serverSideCondition.type] = itemIsInColonDelimitedList` or `column[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `preference` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `column[serverSideCondition.type] = userPreference=value` or `column[serverSideCondition.type] = userPreference!=value`;
- `page` — `<INTEGER>`; —; Yes; —; —; —; `column[serverSideCondition.type] = currentPage=page` or `column[serverSideCondition.type] = currentPage!=page`;
- `pages` — `<INTEGER>`; —; Yes; —; —; —; `column[serverSideCondition.type] = currentPageInList` or `column[serverSideCondition.type] = currentPageNotInList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[serverSideCondition.type] = textIsContainedInItem` or `column[serverSideCondition.type] = textIsContainedInValue` or `column[serverSideCondition.type] = textIsNotContainedInValue` or `column[serverSideCondition.type] = text=value` or `column[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `column[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `column[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[serverSideCondition.type] = expression` and `column[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[serverSideCondition.type] = expression` and `column[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[serverSideCondition.type] = expression` and `column[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[serverSideCondition.type] = functionBody` and `column[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[serverSideCondition.type] = functionBody` and `column[serverSideCondition.language] = javaScript-mle`;

### source

- `type` — `<STRING>`; —; Yes; `DB_COLUMN`; `<enum:[databaseColumn:"Database Column", sqlExpression:"SQL Expression", none:"None"]>`; —; —;
- `databaseColumn` — `<STRING>`; —; Yes; —; —; maxLength=128; `column[source.type] = databaseColumn`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[source.type] = sqlExpression`;
- `dataType` — `<STRING>`; —; Yes; —; `<enum:[varchar2:"VARCHAR2", number:"NUMBER", date:"DATE", timestamp:"TIMESTAMP", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", intervalYearToMonth:"INTERVAL YEAR TO MONTH", intervalDayToSecond:"INTERVAL DAY TO SECOND", clob:"CLOB", blob:"BLOB", boolean:"BOOLEAN", rowid:"ROWID", bfile:"BFILE", sdoGeometry:"SDO_GEOMETRY"]>`; maxLength=128; —;
- `primaryKey` — `<BOOLEAN>`; —; Yes; `N`; —; —; `column[source.type] = databaseColumn`;
- `availableOnClient` — `<BOOLEAN>`; —; Yes; `N`; —; —; `column[source.type] = databaseColumn` and `column[source.primaryKey] = N`;
- `valueProtected` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `column[source.type] = databaseColumn` and `column[source.primaryKey] = N` and `column[source.availableOnClient] = Y`;

### layout

- `sequence` — `<NUMBER>`; Enter the display sequence for this column. The sequence setting determines where this column is displayed in relation to other columns within the region. Note: If two columns, within the same region, have the same sequence value then they may be displayed in a different order when the application is exported and imported into another environment, such as a test or production environment. To ensure consistency, Oracle recommends you specify unique sequence numbers for every item, or at least for those within the same region.; Yes; —; —; —; —;

### appearance

- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; `column[source.dataType] = date` or `column[source.dataType] = timestamp` or `column[source.dataType] = timestampWithTimeZone` or `column[source.dataType] = timestampWithLocalTimeZone` or `column[source.dataType] = number`;
- `group` — `<BOOLEAN>`; —; Yes; `N`; —; —; `column[source.dataType] = varchar2` and `column[source.type] = databaseColumn` or `column[source.dataType] = varchar2` and `column[source.type] = sqlExpression` or `column[source.dataType] = number` and `column[source.type] = databaseColumn` or `column[source.dataType] = number` and `column[source.type] = sqlExpression` or `column[source.dataType] = date` and `column[source.type] = databaseColumn` or `column[source.dataType] = date` and `column[source.type] = sqlExpression` or `column[source.dataType] = timestamp` and `column[source.type] = databaseColumn` or `column[source.dataType] = timestamp` and `column[source.type] = sqlExpression` or `column[source.dataType] = timestampWithTimeZone` and `column[source.type] = databaseColumn` or `column[source.dataType] = timestampWithTimeZone` and `column[source.type] = sqlExpression` or `column[source.dataType] = timestampWithLocalTimeZone` and `column[source.type] = databaseColumn` or `column[source.dataType] = timestampWithLocalTimeZone` and `column[source.type] = sqlExpression` or `column[source.dataType] = intervalYearToMonth` and `column[source.type] = databaseColumn` or `column[source.dataType] = intervalYearToMonth` and `column[source.type] = sqlExpression`;

### lov

- `type` — `<STRING>`; —; No; —; `<enum:[sharedComponent:"Shared Component", sqlQuery:"SQL Query", staticValues:"Static Values", functionBody:"Function Body returning SQL Query"]>`; —; —;
- `lov` — `<@lov>`; —; Yes; —; —; lovType=COMPONENT; `column[lov.type] = sharedComponent`;
- `displayExtraValues` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `column[lov.type] = sample`;
- `sqlQuery` — `<STRING>`; Enter the SQL query definition to populate this list of values. Generally list of value queries are of the form:  select [displayValue],        [returnValue]   from ...  where ...  order by ...  Each column selected must have a unique name or alias. Oracle recommends using an alias on any column that includes an SQL expression. Note: When defining a Popup LOV item type, if you would like to display multiple columns in the popup, you must instead define your List of Values in Shared Components, with the required additional metadata. Inline list of values can only be used to display single columns for Popup LOVs.; Yes; —; —; maxLength=4000; `column[lov.type] = sqlQuery`;
- `staticValues` — `<STRING>`; —; Yes; `STATIC:Display1\;Return1,Display2\;Return2`; —; maxLength=4000; `column[lov.type] = staticValues`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `column[lov.type] = functionBody`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `column[lov.type] = functionBody` and `column[lov.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `column[lov.type] = functionBody` and `column[lov.language] = javaScript-mle`;

### accessibility

- `valueIdentifiesRow` — `<BOOLEAN>`; —; Yes; `N`; —; —; `attributes[componentAppearance.display] = report`;

