# plugin-variants/sendEMail

- componentType: `action`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[sendEMail:"Send E-Mail"]>`; —; —;

### error

- `stopExecutionOnError` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `logging` — `<STRING>`; —; Yes; `NONE`; `<enum:[none:"None", success:"Success", failure:"Failure", all:"All"]>`; —; —;
- `errorMessage` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### execution

- `onEvent` — `<STRING>`; —; Yes; `CLAIM`; `<enum:[claim:"Claim", complete:"Complete", delegate:"Delegate", updateComment:"Update Comment", updatePriority:"Update Priority", updateParameter:"Update Parameter", release:"Release", cancel:"Cancel", create:"Create", requestInformation:"Request Information", submitInformation:"Submit Information", beforeExpire:"Before Expire", expire:"Expire"]>`; —; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `outcome` — `<STRING>`; —; No; —; `<enum:[approved:"Approved", rejected:"Rejected"]>`; —; `action[execution.onEvent] = complete` and `taskDefinition[identification.type] = approval`;
- `beforeExpirationInterval` — `<STRING>`; —; No; —; —; —; `action[execution.onEvent] = beforeExpire`;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### successMessage

- `successMessage` — `<STRING>`; —; No; —; —; maxLength=4000; —;

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

### emailAttachments

- `attachmentSql` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### emailHeader

- `to` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `bcc` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `cc` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `from` — `<STRING>`; —; Yes; `&APP_EMAIL.`; —; maxLength=4000; —;

### emailDispatchMode

- `sendImmediately` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### emailTemplate

- `emailTemplate` — `<@emailTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `placeholderValues` — `<STRING>`; —; No; —; —; maxLength=4000; `action[emailTemplate.emailTemplate] = sample`;
- `languageOverride` — `<STRING>`; —; No; —; —; maxLength=128; `action[emailTemplate.emailTemplate] = sample`;
- `escapeBodySubstitutions` — `<STRING>`; —; No; `HTML`; `<enum:[true:"Yes", false:"No"]>`; maxLength=4000; `action[emailContent.bodyHtml] = sample`;

### emailContent

- `replyTo` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `subject` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `bodyHtml` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `bodyPlainText` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

### source

- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL"]>`; —; —;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `action[source.location] = restEnabledSql`;
- `plsqlCode` — `<STRING>`; —; Yes; —; —; —; `action[source.location] = restEnabledSql` or `action[source.location] = localDatabase` and `action[source.language] = plsql`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `action[source.location] = localDatabase`;
- `javaScriptCode` — `<STRING>`; —; Yes; —; —; —; `action[source.location] = localDatabase` and `action[source.language] = javaScript-mle`;

