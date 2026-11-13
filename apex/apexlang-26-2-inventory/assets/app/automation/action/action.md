# action

- componentType: `action`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a name for the automation action.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[executeCode:"Execute Code", executeCode:"Execute Code", sendEMail:"Send E-Mail", sendEMail:"Send E-Mail", sendPushNotification:"Send Push Notification", sendPushNotification:"Send Push Notification", serverSideGeocoding:"Server Side Geocoding", serverSideGeocoding:"Server Side Geocoding"]>`; —; —;

### error

- `stopExecutionOnError` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `errorMessage` — `<STRING>`; Enter an error message to be written to the automation log when the processing fails. Use #SQLERRM# as a placeholder for the actual ORA error message.; No; —; —; maxLength=4000; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[rowsReturned:"Rows returned", noRowsReturned:"No Rows returned", expression:"Expression", functionBody:"Function Body", item=value:"Item = Value", item!=value:"Item != Value", itemIsNull:"Item is NULL", itemIsNotNull:"Item is NOT NULL", itemIsZero:"Item is zero", itemIsNotZero:"Item is NOT zero", itemIsNullOrZero:"Item is NULL or zero", itemIsNotNullAndNotZero:"Item is NOT NULL and NOT zero", itemContainsNoSpaces:"Item contains no spaces", itemIsNumeric:"Item is numeric", itemIsNotNumeric:"Item is NOT numeric", itemIsAlphanumeric:"Item is alphanumeric", itemIsInColonDelimitedList:"Item is in colon delimited list", itemIsNotInColonDelimitedList:"Item is NOT in colon delimited list", textIsContainedInItem:"Text is contained in Item", text=value:"Text = Value", text!=value:"Text != Value", textIsContainedInValue:"Text is contained in Value", textIsNotContainedInValue:"Text is NOT contained in Value", never:"Never"]>`; —; —;
- `executeCondition` — `<STRING>`; Specify whether the condition is to be executed for each row or only once.; Yes; `Y`; `<enum:[forEachRow:"For Each Row", once:"Once"]>`; —; `action[serverSideCondition.type] = sample`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = rowsReturned` or `action[serverSideCondition.type] = noRowsReturned`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `action[serverSideCondition.type] = item=value` or `action[serverSideCondition.type] = item!=value` or `action[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `action[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `action[serverSideCondition.type] = itemIsNull` or `action[serverSideCondition.type] = itemIsNotNull` or `action[serverSideCondition.type] = itemIsZero` or `action[serverSideCondition.type] = itemIsNotZero` or `action[serverSideCondition.type] = itemIsNullOrZero` or `action[serverSideCondition.type] = itemIsNotNullAndNotZero` or `action[serverSideCondition.type] = itemContainsNoSpaces` or `action[serverSideCondition.type] = itemIsNumeric` or `action[serverSideCondition.type] = itemIsNotNumeric` or `action[serverSideCondition.type] = itemIsAlphanumeric` or `action[serverSideCondition.type] = itemIsInColonDelimitedList` or `action[serverSideCondition.type] = itemIsNotInColonDelimitedList` or `action[serverSideCondition.type] = textIsContainedInItem`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = itemIsInColonDelimitedList` or `action[serverSideCondition.type] = itemIsNotInColonDelimitedList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = textIsContainedInItem` or `action[serverSideCondition.type] = textIsContainedInValue` or `action[serverSideCondition.type] = textIsNotContainedInValue` or `action[serverSideCondition.type] = text=value` or `action[serverSideCondition.type] = text!=value`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = item=value` or `action[serverSideCondition.type] = item!=value` or `action[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `action[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `action[serverSideCondition.type] = textIsContainedInValue` or `action[serverSideCondition.type] = textIsNotContainedInValue` or `action[serverSideCondition.type] = text=value` or `action[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `action[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `action[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = expression` and `action[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = expression` and `action[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = expression` and `action[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = functionBody` and `action[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `action[serverSideCondition.type] = functionBody` and `action[serverSideCondition.language] = javaScript-mle`;

### execution

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### source

- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL"]>`; —; `action[identification.type] = executeCode`;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `action[identification.type] = executeCode` and `action[source.location] = restEnabledSql`;
- `plsqlCode` — `<STRING>`; Enter the PL/SQL code to be executed on the remote database.; Yes; —; —; —; `action[identification.type] = executeCode` and `action[source.location] = restEnabledSql`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `action[identification.type] = executeCode` and `action[source.location] = localDatabase`;
- `plsqlCode` — `<STRING>`; —; Yes; —; —; —; `action[identification.type] = executeCode` and `action[source.location] = localDatabase` and `action[source.language] = plsql`;
- `javaScriptCode` — `<STRING>`; —; Yes; —; —; —; `action[identification.type] = executeCode` and `action[source.location] = localDatabase` and `action[source.language] = javaScript-mle`;

