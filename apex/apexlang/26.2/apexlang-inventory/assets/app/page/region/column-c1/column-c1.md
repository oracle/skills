# column

- componentType: `column`
- identifierRequired: true
- appliesWhen: `region[identification.type] = interactiveReport`

## Properties

### advanced

- `endUserAlias` — `<STRING>`; —; No; —; —; maxLength=10, textCase=UPPER; —;
- `htmlDomId` — `<STRING>`; Enter the DOM ID for the column. If defined, the DOM ID is used as the ID for the corresponding table header (TH) cell, and as the HEADERS value for corresponding table data (TD) cells. The DOM ID can be useful when developing custom JavaScript behavior, or custom style for the column. If the DOM ID is not defined, the table generates an internal ID for these attribute values.; No; —; —; maxLength=255; —;

### source

- `dataType` — `<STRING>`; —; Yes; —; `<enum:[varchar2:"Varchar2", date:"Date", number:"Number", clob:"Clob", boolean:"Boolean", other:"Other"]>`; —; —;
- `timezoneAware` — `<STRING>`; —; Yes; `N`; —; —; `column[source.dataType] = date`;
- `primaryKey` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `availableOnClient` — `<BOOLEAN>`; —; Yes; `N`; —; —; `column[source.primaryKey] = N`;
- `valueProtected` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `column[source.primaryKey] = N` and `column[source.availableOnClient] = Y`;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;
- `escapeSpecialChars` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `column[identification.type] = plainText` or `column[identification.type] = link` or `column[identification.type] = hidden`;

### identification (direct group)

- `columnName` — `<STRING>`; —; Yes; —; —; maxLength=128; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[displayImage:"Display Image", displayImage:"Display Image", downloadBlob:"Download BLOB", downloadBlob:"Download BLOB", hidden:"Hidden", hidden:"Hidden", link:"Link", link:"Link", percentGraph:"Percent Graph", percentGraph:"Percent Graph", plainText:"Plain Text", plainText:"Plain Text", plainTextBasedOnLov:"Plain Text (based on List of Values)", plainTextBasedOnLov:"Plain Text (based on List of Values)", removeHtml:"Remove HTML", removeHtml:"Remove HTML", richText:"Rich Text", richText:"Rich Text", rowSelector:"Row Selector", rowSelector:"Row Selector", themeTemplateComponent/actions:"Actions", themeTemplateComponent/avatar:"Avatar", themeTemplateComponent/badge:"Badge", themeTemplateComponent/button:"Button", themeTemplateComponent/comments:"Comments", themeTemplateComponent/contentRow:"Content Row", themeTemplateComponent/mediaList:"Media List", themeTemplateComponent/metricCard:"Metric Card", themeTemplateComponent/timeline:"Timeline"]>`; —; —;

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

### appearance

- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = plainText` or `column[identification.type] = link` or `column[identification.type] = removeHtml`;
- `backgroundColor` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = percentGraph`;
- `foregroundColor` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = percentGraph`;
- `barWidth` — `<INTEGER>`; —; No; —; —; —; `column[identification.type] = percentGraph`;
- `viewFileAs` — `<STRING>`; —; Yes; `attachment`; `<enum:[attachment:"Attachment", inline:"Inline"]>`; —; `column[identification.type] = downloadBlob`;
- `downloadText` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = downloadBlob`;
- `cssClasses` — `<STRING>`; Enter CSS classes to apply to each cell in this column. You may add multiple classes by separating them with spaces.; No; —; —; maxLength=255; —;

### lov

- `lov` — `<@lov>`; —; Yes; —; —; lovType=COMPONENT; `column[identification.type] = plainTextBasedOnLov`;

### genAI

- `columnContext` — `<STRING>`; —; No; —; —; —; `attributes[genAI.naturalLanguageSupport] = Y`;
- `referenceDataType` — `<STRING>`; —; No; —; `<enum:[sharedComponent:"Shared Component", sqlQuery:"SQL Query", staticValues:"Static Values"]>`; —; `attributes[genAI.naturalLanguageSupport] = Y`;
- `lov` — `<@lov>`; —; Yes; —; —; lovType=COMPONENT; `attributes[genAI.naturalLanguageSupport] = Y` and `column[genAI.referenceDataType] = sharedComponent`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `attributes[genAI.naturalLanguageSupport] = Y` and `column[genAI.referenceDataType] = sqlQuery`;
- `staticValues` — `<STRING>`; —; Yes; `STATIC:Display1\;Return1,Display2\;Return2`; —; maxLength=4000; `attributes[genAI.naturalLanguageSupport] = Y` and `column[genAI.referenceDataType] = staticValues`;

### layout

- `group` — `<@columnGroup>`; —; No; —; —; lovType=COMPONENT; —;
- `columnAlignment` — `<STRING>`; —; Yes; `LEFT`; `<enum:[start:"start", center:"center", end:"end"]>`; —; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### heading

- `heading` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `alignment` — `<STRING>`; —; Yes; `LEFT`; `<enum:[start:"start", center:"center", end:"end"]>`; —; —;
- `alternativeLabel` — `<STRING>`; Enter the alternative label to use in dialogs and in various column heading placements.         Use an alternative label when the heading contains extra formatting, such as HTML tags, which do not display properly.; No; —; —; maxLength=4000; —;

### singleRowView

- `useColumnHeading` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `label` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[singleRowView.useColumnHeading] = N`;

### enableUsersTo

- `hide` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `sort` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `filter` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `highlight` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `controlBreak` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `aggregate` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `compute` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `chart` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `groupBy` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `pivot` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### columnFilter

- `type` — `<STRING>`; —; Yes; `D`; `<enum:[none:"None", defaultBasedOnColumnType:"Default Based on Column Type", definedLovExactMatch:"Use Defined List of Values to Filter Exact Match", definedLovWordContains:"Use Defined List of Values to Filter Word Contains", namedLovExactMatch:"Use Named List of Values to Filter Exact Match", namedLovWordContains:"Use Named List of Values to Filter Word Contains"]>`; —; —;
- `type` — `<STRING>`; —; Yes; `1`; `<enum:[none:"None", defaultBasedOnColumnType:"Default Based on Column Type", definedLovExactMatch:"Use Defined List of Values to Filter Exact Match", definedLovWordContains:"Use Defined List of Values to Filter Word Contains", namedLovExactMatch:"Use Named List of Values to Filter Exact Match", namedLovWordContains:"Use Named List of Values to Filter Word Contains"]>`; —; `column[identification.type] = plainTextBasedOnLov`;
- `dateRanges` — `<STRING>`; —; Yes; `ALL`; `<enum:[all:"All", past:"Past", future:"Future"]>`; —; `column[source.dataType] = date` and `column[columnFilter.type] = defaultBasedOnColumnType`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[columnFilter.type] = definedLovExactMatch` or `column[columnFilter.type] = definedLovWordContains` or `column[identification.type] = plainTextBasedOnLov` and `column[columnFilter.type] = definedLovExactMatch` or `column[identification.type] = plainTextBasedOnLov` and `column[columnFilter.type] = definedLovWordContains`;
- `namedLov` — `<@lov>`; —; Yes; —; —; lovType=COMPONENT; `column[columnFilter.type] = namedLovExactMatch` or `column[columnFilter.type] = namedLovWordContains`;

### columnFormatting

- `htmlExpression` — `<STRING>`; —; No; —; —; maxLength=4000; `column[identification.type] = plainText` or `column[identification.type] = plainTextBasedOnLov`;

### link

- `target` — `<COMPLEX>`; —; No; —; —; —; `column[identification.type] = link` or `column[identification.type] = percentGraph` or `column[identification.type] = plainTextBasedOnLov`;
- `linkText` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.type] = link` and `column[link.target] = sample` or `column[identification.type] = percentGraph` and `column[link.target] = sample` or `column[identification.type] = plainTextBasedOnLov` and `column[link.target] = sample`;
- `linkAttributes` — `<STRING>`; —; No; —; —; maxLength=4000; `column[identification.type] = link` and `column[link.target] = sample` or `column[identification.type] = percentGraph` and `column[link.target] = sample` or `column[identification.type] = plainTextBasedOnLov` and `column[link.target] = sample`;

### accessibility

- `valueIdentifiesRow` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `imageDescription` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = displayImage`;

### help

- `helpText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### blobAttributes

- `tableOwner` — `<STRING>`; —; No; —; —; —; `column[identification.type] = displayImage` or `column[identification.type] = downloadBlob`;
- `tableName` — `<STRING>`; —; Yes; —; —; —; `column[identification.type] = displayImage` or `column[identification.type] = downloadBlob`;
- `blobColumn` — `<STRING>`; —; Yes; —; —; —; `column[identification.type] = displayImage` or `column[identification.type] = downloadBlob`;
- `primaryKeyColumn1` — `<STRING>`; —; Yes; —; —; —; `column[identification.type] = displayImage` or `column[identification.type] = downloadBlob`;
- `primaryKeyColumn2` — `<STRING>`; —; No; —; —; —; `column[identification.type] = displayImage` or `column[identification.type] = downloadBlob`;
- `mimeTypeColumn` — `<STRING>`; —; No; —; —; —; `column[identification.type] = displayImage` or `column[identification.type] = downloadBlob`;
- `filenameColumn` — `<STRING>`; —; No; —; —; —; `column[identification.type] = displayImage` or `column[identification.type] = downloadBlob`;
- `charSetColumn` — `<STRING>`; —; No; —; —; —; `column[identification.type] = downloadBlob`;
- `lastUpdatedColumn` — `<STRING>`; —; No; —; —; —; `column[identification.type] = displayImage` or `column[identification.type] = downloadBlob`;

### rowSelection

- `currentSelectionPageItem` — `<STRING>`; —; No; —; —; maxLength=255, textCase=UPPER; `column[identification.type] = rowSelector`;
- `enableMultiSelect` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `column[identification.type] = rowSelector`;
- `hideControl` — `<BOOLEAN>`; —; Yes; `N`; —; —; `column[identification.type] = rowSelector`;
- `showSelectAll` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `column[identification.type] = rowSelector` and `column[rowSelection.enableMultiSelect] = Y`;

### settings

- `format` — `<STRING>`; —; Yes; `MARKDOWN`; `<enum:[html:"HTML", markdown:"Markdown"]>`; —; `column[identification.type] = richText`;

