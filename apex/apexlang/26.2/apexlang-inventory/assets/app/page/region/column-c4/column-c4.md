# column

- componentType: `column`
- identifierRequired: true
- appliesWhen: `region[identification.type] = tabform`

## Properties

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;
- `escapeSpecialChars` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `column[identification.type] = plainText` or `column[identification.type] = link` or `column[identification.type] = hidden` or `column[identification.type] = plainTextBasedOnLov`;

### identification (direct group)

- `columnName` — `<STRING>`; —; Yes; —; —; maxLength=128; —;
- `type` — `<STRING>`; —; Yes; `PLAIN`; `<enum:[rowSelector:"Row Selector", plainText:"Plain Text", plainTextSavesState:"Plain Text (saves state)", plainTextBasedOnLov:"Plain Text (based on List of Values)", link:"Link", displayImage:"Display Image", downloadBlob:"Download BLOB", percentGraph:"Percent Graph", textField:"Text Field", textArea:"Text Area", selectList:"Select List", popupLovShowsDisplaysValue:"Popup LOV (shows displays value)", popupLovShowsReturnValue:"Popup LOV (shows return value)", radioGroup:"Radio Group", simpleCheckbox:"Simple Checkbox", datePicker:"Date Picker", datePickerClassic:"Date Picker (Classic)", hidden:"Hidden", hiddenSavesState:"Hidden (saves state)"]>`; —; —;
- `reportColumnQueryId` — `<STRING>`; —; No; —; —; maxLength=4; —;
- `derivedColumn` — `<STRING>`; —; No; —; —; maxLength=4; —;

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

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `columnAlignment` — `<STRING>`; —; Yes; `LEFT`; `<enum:[start:"start", center:"center", end:"end"]>`; —; —;

### appearance

- `template` — `<@fieldTemplate>`; Choose the field template to be used when rendering the tabular form field. When no template is selected, the field is rendered using the default accessibility compliant label.; No; —; `<enum:[@/hidden, @/optional, @/optional-above, @/optional-floating, @/required, @/required-above, @/required-floating]>`; —; `column[identification.type] = plainTextSavesState` or `column[identification.type] = textField` or `column[identification.type] = textArea` or `column[identification.type] = datePickerClassic` or `column[identification.type] = datePicker` or `column[identification.type] = hiddenSavesState` or `column[identification.type] = selectList` or `column[identification.type] = radioGroup` or `column[identification.type] = popupLovShowsReturnValue` or `column[identification.type] = popupLovShowsDisplaysValue` or `column[identification.type] = simpleCheckbox`;
- `formatMask` — `<STRING>`; Enter the format mask to apply to this column.     You can type in the format mask or pick from the predefined list, based on a sample representation of how that format mask is displayed.     It is important that number format masks are only applied to columns that contain numbers and date format masks are only applied to columns that contain dates.     Otherwise, a runtime error is raised when any record contains a value that can not be converted using the specified format mask.; No; —; —; maxLength=255; `column[identification.type] = plainText` or `column[identification.type] = link` or `column[identification.type] = plainTextSavesState` or `column[identification.type] = textField` or `column[identification.type] = datePicker`;
- `width` — `<NUMBER>`; —; No; —; —; —; `column[identification.type] = textField` or `column[identification.type] = textArea` or `column[identification.type] = datePickerClassic` or `column[identification.type] = datePicker` or `column[identification.type] = popupLovShowsReturnValue` or `column[identification.type] = popupLovShowsDisplaysValue`;
- `height` — `<NUMBER>`; —; No; —; —; —; `column[identification.type] = textArea`;
- `formatMask` — `<STRING>`; —; Yes; —; `<enum:[useAppDateFormat:"Use Application Date Format", useAppFormatMask:"Use Application Format Mask", useItemFormatMask:"Use Item Format Mask", ddMmYyyy:"DD-MM-YYYY", ddMmYyyyHhMi:"DD-MM-YYYY HH:MI", ddMmYyyyHh24Mi:"DD-MM-YYYY HH24:MI", ddMonRr:"DD-MON-RR", ddMonRrHhMi:"DD-MON-RR HH:MI", ddMonRrHh24Mi:"DD-MON-RR HH24:MI", ddMonYyyy:"DD-MON-YYYY", ddMonYyyyHhMi:"DD-MON-YYYY HH:MI", ddMonYyyyHh24Mi:"DD-MON-YYYY HH24:MI", mmDdYyyy:"MM/DD/YYYY", mmDdYyyyHhMi:"MM/DD/YYYY HH:MI", mmDdYyyyHh24Mi:"MM/DD/YYYY HH24:MI", rrMonDd:"RR-MON-DD", rrMonDdHhMi:"RR-MON-DD HH:MI", rrMonDdHh24Mi:"RR-MON-DD HH24:MI", yyyyDdMm:"YYYY.DD.MM", yyyyDdMmHhMi:"YYYY.DD.MM HH:MI", yyyyDdMmHh24Mi:"YYYY.DD.MM HH24:MI", yyyyMmDd:"YYYY-MM-DD", yyyyMmDdHhMi:"YYYY-MM-DD HH:MI", yyyyMmDdHh24Mi:"YYYY-MM-DD HH24:MI"]>`; —; `column[identification.type] = datePickerClassic`;
- `backgroundColor` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = percentGraph`;
- `foregroundColor` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = percentGraph`;
- `barWidth` — `<INTEGER>`; —; No; —; —; —; `column[identification.type] = percentGraph`;
- `viewFileAs` — `<STRING>`; —; Yes; `attachment`; `<enum:[attachment:"Attachment", inline:"Inline"]>`; —; `column[identification.type] = downloadBlob`;
- `downloadText` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = downloadBlob`;

### lov

- `displayExtraValues` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `column[identification.type] = selectList` or `column[identification.type] = radioGroup`;
- `displayNullValue` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `column[identification.type] = selectList` or `column[identification.type] = radioGroup` or `column[identification.type] = popupLovShowsReturnValue` or `column[identification.type] = popupLovShowsDisplaysValue`;
- `type` — `<STRING>`; —; Yes; —; `<enum:[sharedComponent:"Shared Component", sqlQuery:"SQL Query", staticValues:"Static Values", functionBody:"Function Body returning SQL Query"]>`; —; `column[identification.type] = plainTextBasedOnLov` or `column[identification.type] = selectList` or `column[identification.type] = radioGroup` or `column[identification.type] = popupLovShowsReturnValue` or `column[identification.type] = popupLovShowsDisplaysValue`;
- `checkboxValues` — `<STRING>`; —; Yes; —; —; —; `column[identification.type] = simpleCheckbox`;
- `lov` — `<@lov>`; —; Yes; —; —; lovType=COMPONENT; `column[identification.type] = plainTextBasedOnLov` and `column[lov.type] = sharedComponent` or `column[identification.type] = selectList` and `column[lov.type] = sharedComponent` or `column[identification.type] = radioGroup` and `column[lov.type] = sharedComponent` or `column[identification.type] = popupLovShowsReturnValue` and `column[lov.type] = sharedComponent` or `column[identification.type] = popupLovShowsDisplaysValue` and `column[lov.type] = sharedComponent`;
- `nullDisplayValue` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = selectList` and `column[lov.displayNullValue] = Y` or `column[identification.type] = radioGroup` and `column[lov.displayNullValue] = Y` or `column[identification.type] = popupLovShowsReturnValue` and `column[lov.displayNullValue] = Y` or `column[identification.type] = popupLovShowsDisplaysValue` and `column[lov.displayNullValue] = Y`;
- `nullReturnValue` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = selectList` and `column[lov.displayNullValue] = Y` or `column[identification.type] = radioGroup` and `column[lov.displayNullValue] = Y` or `column[identification.type] = popupLovShowsReturnValue` and `column[lov.displayNullValue] = Y` or `column[identification.type] = popupLovShowsDisplaysValue` and `column[lov.displayNullValue] = Y`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.type] = plainTextBasedOnLov` and `column[lov.type] = sqlQuery` or `column[identification.type] = selectList` and `column[lov.type] = sqlQuery` or `column[identification.type] = radioGroup` and `column[lov.type] = sqlQuery` or `column[identification.type] = popupLovShowsReturnValue` and `column[lov.type] = sqlQuery` or `column[identification.type] = popupLovShowsDisplaysValue` and `column[lov.type] = sqlQuery`;
- `staticValues` — `<STRING>`; —; Yes; `STATIC:Display1\;Return1,Display2\;Return2`; —; maxLength=4000; `column[identification.type] = plainTextBasedOnLov` and `column[lov.type] = staticValues` or `column[identification.type] = selectList` and `column[lov.type] = staticValues` or `column[identification.type] = radioGroup` and `column[lov.type] = staticValues` or `column[identification.type] = popupLovShowsReturnValue` and `column[lov.type] = staticValues` or `column[identification.type] = popupLovShowsDisplaysValue` and `column[lov.type] = staticValues`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `column[identification.type] = plainTextBasedOnLov` and `column[lov.type] = functionBody` or `column[identification.type] = selectList` and `column[lov.type] = functionBody` or `column[identification.type] = radioGroup` and `column[lov.type] = functionBody` or `column[identification.type] = popupLovShowsReturnValue` and `column[lov.type] = functionBody` or `column[identification.type] = popupLovShowsDisplaysValue` and `column[lov.type] = functionBody`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; —; `column[identification.type] = plainTextBasedOnLov` and `column[lov.type] = functionBody` and `column[lov.language] = plsql` or `column[identification.type] = selectList` and `column[lov.type] = functionBody` and `column[lov.language] = plsql` or `column[identification.type] = radioGroup` and `column[lov.type] = functionBody` and `column[lov.language] = plsql` or `column[identification.type] = popupLovShowsReturnValue` and `column[lov.type] = functionBody` and `column[lov.language] = plsql` or `column[identification.type] = popupLovShowsDisplaysValue` and `column[lov.type] = functionBody` and `column[lov.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; —; `column[identification.type] = plainTextBasedOnLov` and `column[lov.type] = functionBody` and `column[lov.language] = javaScript-mle` or `column[identification.type] = selectList` and `column[lov.type] = functionBody` and `column[lov.language] = javaScript-mle` or `column[identification.type] = radioGroup` and `column[lov.type] = functionBody` and `column[lov.language] = javaScript-mle` or `column[identification.type] = popupLovShowsReturnValue` and `column[lov.type] = functionBody` and `column[lov.language] = javaScript-mle` or `column[identification.type] = popupLovShowsDisplaysValue` and `column[lov.type] = functionBody` and `column[lov.language] = javaScript-mle`;

### advanced

- `cssClasses` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = textField` or `column[identification.type] = textArea` or `column[identification.type] = datePickerClassic` or `column[identification.type] = datePicker` or `column[identification.type] = hiddenSavesState` or `column[identification.type] = selectList` or `column[identification.type] = radioGroup` or `column[identification.type] = popupLovShowsReturnValue` or `column[identification.type] = popupLovShowsDisplaysValue` or `column[identification.type] = simpleCheckbox`;
- `customAttributes` — `<STRING>`; —; No; —; —; maxLength=2000; `column[identification.type] = textField` or `column[identification.type] = textArea` or `column[identification.type] = datePickerClassic` or `column[identification.type] = datePicker` or `column[identification.type] = hiddenSavesState` or `column[identification.type] = selectList` or `column[identification.type] = radioGroup` or `column[identification.type] = popupLovShowsReturnValue` or `column[identification.type] = popupLovShowsDisplaysValue` or `column[identification.type] = simpleCheckbox`;
- `computeSum` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `cellWidth` — `<INTEGER>`; —; No; —; —; —; —;

### heading

- `heading` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `alignment` — `<STRING>`; —; Yes; `LEFT`; `<enum:[start:"start", center:"center", end:"end"]>`; —; —;

### columnFormatting

- `htmlExpression` — `<STRING>`; —; No; —; —; maxLength=4000; `column[identification.type] = plainText`;
- `cssClasses` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = plainText` or `column[identification.type] = link` or `column[identification.type] = percentGraph`;
- `cssStyle` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = plainText` or `column[identification.type] = link` or `column[identification.type] = percentGraph`;
- `highlightWords` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = plainText`;

### link

- `target` — `<COMPLEX>`; —; No; —; —; —; `column[identification.type] = link` or `column[identification.type] = percentGraph`;
- `linkText` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.type] = link` and `column[link.target] = sample` or `column[identification.type] = percentGraph` and `column[link.target] = sample`;
- `linkAttributes` — `<STRING>`; —; No; —; —; maxLength=4000; `column[identification.type] = link` and `column[link.target] = sample` or `column[identification.type] = percentGraph` and `column[link.target] = sample`;

### accessibility

- `valueIdentifiesRow` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `imageDescription` — `<STRING>`; —; No; —; —; maxLength=255; `column[identification.type] = displayImage`;

### element

- `numberOfColumns` — `<INTEGER>`; —; No; —; —; —; `column[identification.type] = radioGroup`;

### sorting

- `defaultSequence` — `<STRING>`; —; No; —; `<enum:[1:"1", 2:"2", 3:"3", 4:"4", 5:"5", 6:"6", 7:"7", 8:"8"]>`; —; —;
- `sortable` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `direction` — `<STRING>`; —; No; —; `<enum:[desc:"Descending"]>`; —; `column[sorting.defaultSequence] = sample`;

### exportPrinting

- `includeInExportPrint` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `printWidth` — `<STRING>`; —; No; —; —; maxLength=4000; `column[exportPrinting.includeInExportPrint] = Y`;

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

### default

- `type` — `<STRING>`; —; No; —; `<enum:[item:"Item", plsqlExpression:"PL/SQL Expression"]>`; —; `column[identification.type] = plainTextSavesState` or `column[identification.type] = datePickerClassic` or `column[identification.type] = datePicker` or `column[identification.type] = textField` or `column[identification.type] = textArea` or `column[identification.type] = selectList` or `column[identification.type] = radioGroup` or `column[identification.type] = hiddenSavesState` or `column[identification.type] = popupLovShowsReturnValue` or `column[identification.type] = popupLovShowsDisplaysValue` or `column[identification.type] = simpleCheckbox` or `column[identification.type] = rowSelector`;
- `item` — `<STRING>`; —; Yes; —; —; textCase=UPPER; `column[identification.type] = plainTextSavesState` and `column[default.type] = item` or `column[identification.type] = datePickerClassic` and `column[default.type] = item` or `column[identification.type] = datePicker` and `column[default.type] = item` or `column[identification.type] = textField` and `column[default.type] = item` or `column[identification.type] = textArea` and `column[default.type] = item` or `column[identification.type] = selectList` and `column[default.type] = item` or `column[identification.type] = radioGroup` and `column[default.type] = item` or `column[identification.type] = hiddenSavesState` and `column[default.type] = item` or `column[identification.type] = popupLovShowsReturnValue` and `column[default.type] = item` or `column[identification.type] = popupLovShowsDisplaysValue` and `column[default.type] = item` or `column[identification.type] = simpleCheckbox` and `column[default.type] = item` or `column[identification.type] = rowSelector` and `column[default.type] = item`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[identification.type] = plainTextSavesState` and `column[default.type] = plsqlExpression` or `column[identification.type] = datePickerClassic` and `column[default.type] = plsqlExpression` or `column[identification.type] = datePicker` and `column[default.type] = plsqlExpression` or `column[identification.type] = textField` and `column[default.type] = plsqlExpression` or `column[identification.type] = textArea` and `column[default.type] = plsqlExpression` or `column[identification.type] = selectList` and `column[default.type] = plsqlExpression` or `column[identification.type] = radioGroup` and `column[default.type] = plsqlExpression` or `column[identification.type] = hiddenSavesState` and `column[default.type] = plsqlExpression` or `column[identification.type] = popupLovShowsReturnValue` and `column[default.type] = plsqlExpression` or `column[identification.type] = popupLovShowsDisplaysValue` and `column[default.type] = plsqlExpression` or `column[identification.type] = simpleCheckbox` and `column[default.type] = plsqlExpression` or `column[identification.type] = rowSelector` and `column[default.type] = plsqlExpression`;

### primaryKeySource

- `type` — `<STRING>`; —; No; —; `<enum:[existingTrigger:"Existing trigger", plsqlExpression:"PL/SQL Expression", existingSequence:"Existing sequence"]>`; —; —;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `column[primaryKeySource.type] = plsqlExpression`;
- `name` — `<STRING>`; —; Yes; —; —; maxLength=128; `column[primaryKeySource.type] = existingSequence`;

