# action

- componentType: `action`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a name for the task definition action.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[executeCode:"Execute Code", executeCode:"Execute Code", sendEMail:"Send E-Mail", sendEMail:"Send E-Mail", sendPushNotification:"Send Push Notification", sendPushNotification:"Send Push Notification", serverSideGeocoding:"Server Side Geocoding", serverSideGeocoding:"Server Side Geocoding"]>`; —; —;

### error

- `stopExecutionOnError` — `<BOOLEAN>`; Enable when processing for the current task should stop on error. Subsequent actions will not be processed in this case and the task will go the ERRORED state.; Yes; `Y`; —; —; —;
- `logging` — `<STRING>`; —; Yes; `NONE`; `<enum:[none:"None", success:"Success", failure:"Failure", all:"All"]>`; —; —;
- `errorMessage` — `<STRING>`; Enter an error message to be written to the task history when the processing fails. Use #SQLERRM# as a placeholder for the actual ORA error message.; No; —; —; maxLength=4000; —;

### execution

- `onEvent` — `<STRING>`; —; Yes; `CLAIM`; `<enum:[claim:"Claim", complete:"Complete", setOutcome:"Set Outcome", delegate:"Delegate", updateComment:"Update Comment", updatePriority:"Update Priority", updateParameter:"Update Parameter", release:"Release", cancel:"Cancel", create:"Create", requestInformation:"Request Information", submitInformation:"Submit Information", beforeExpire:"Before Expire", expire:"Expire", fail:"Fail"]>`; —; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `outcome` — `<STRING>`; —; No; —; `<enum:[approved:"Approved", rejected:"Rejected"]>`; —; `action[execution.onEvent] = complete` and `taskDefinition[identification.type] = approval`;
- `beforeExpirationInterval` — `<STRING>`; —; No; —; —; —; `action[execution.onEvent] = beforeExpire`;
- `outcome` — `<STRING>`; —; Yes; —; —; maxLength=255; `action[execution.onEvent] = setOutcome`;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### successMessage

- `successMessage` — `<STRING>`; Enter the success message for this process. If the process runs and does not generate an error, then this process success message displays in the notification section of the resulting page displayed. If you are branching to another page via a URL redirect, you may need to check the preserve success message attribute. For multi row processes, the following substitution string can be used to get the number of records processed:    Insert: #MRI_COUNT#   Update: #MRU_COUNT#   Delete: #MRD_COUNT#  For the Send E-Mail process type the substitution string #TO# can be used to get the addressees of the e-mail. Plug-ins can have other substitution strings as well. See Plug-in documentation for details.; No; —; —; maxLength=4000; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[rowsReturned:"Rows returned", noRowsReturned:"No Rows returned", expression:"Expression", functionBody:"Function Body", item=value:"Item = Value", item!=value:"Item != Value", itemIsNull:"Item is NULL", itemIsNotNull:"Item is NOT NULL", itemIsZero:"Item is zero", itemIsNotZero:"Item is NOT zero", itemIsNullOrZero:"Item is NULL or zero", itemIsNotNullAndNotZero:"Item is NOT NULL and NOT zero", itemContainsNoSpaces:"Item contains no spaces", itemIsNumeric:"Item is numeric", itemIsNotNumeric:"Item is NOT numeric", itemIsAlphanumeric:"Item is alphanumeric", itemIsInColonDelimitedList:"Item is in colon delimited list", itemIsNotInColonDelimitedList:"Item is NOT in colon delimited list", textIsContainedInItem:"Text is contained in Item", text=value:"Text = Value", text!=value:"Text != Value", textIsContainedInValue:"Text is contained in Value", textIsNotContainedInValue:"Text is NOT contained in Value", never:"Never"]>`; —; —;
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

### source

- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL"]>`; —; `action[identification.type] = executeCode`;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `action[identification.type] = executeCode` and `action[source.location] = restEnabledSql`;
- `plsqlCode` — `<STRING>`; Enter the PL/SQL code to be executed on the remote database.; Yes; —; —; —; `action[identification.type] = executeCode` and `action[source.location] = restEnabledSql`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `action[identification.type] = executeCode` and `action[source.location] = localDatabase`;
- `plsqlCode` — `<STRING>`; —; Yes; —; —; —; `action[identification.type] = executeCode` and `action[source.location] = localDatabase` and `action[source.language] = plsql`;
- `javaScriptCode` — `<STRING>`; —; Yes; —; —; —; `action[identification.type] = executeCode` and `action[source.location] = localDatabase` and `action[source.language] = javaScript-mle`;

