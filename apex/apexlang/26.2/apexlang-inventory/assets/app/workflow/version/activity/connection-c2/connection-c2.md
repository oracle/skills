# connection

- componentType: `connection`
- identifierRequired: false
- appliesWhen: `activity[identification.type] = switch` or `activity[identification.type] = draftSwitch`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Name of this workflow switch activity branch.; Yes; —; —; maxLength=255; —;

### activity

- `to` — `<@activity>`; —; Yes; —; —; lovType=COMPONENT; —;

### advanced

- `diagram` — `<STRING>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### condition

- `when` — `<STRING>`; —; Yes; —; `<enum:[true:"True", false:"False", null:"Null"]>`; —; `activity[switch.type] = trueFalseCheck`;
- `operator` — `<STRING>`; —; Yes; —; `<enum:[=:"Is Equal To", !=:"Is Not Equal To", >:"Is Greater Than", <:"Is Less Than", >=:"Is Greater Than Or Equal To", <=:"Is Less Than Or Equal To", isNotNull:"Is Not Null", isNull:"Is Null", otherwise:"Otherwise"]>`; —; `activity[switch.type] = checkWorkflowVar` or `activity[switch.type] = case`;
- `value` — `<STRING>`; —; Yes; —; —; —; `activity[switch.type] = checkWorkflowVar` and `activity[switch.type] = checkWorkflowVar` or `activity[switch.type] = checkWorkflowVar` and `activity[switch.type] = case` or `activity[switch.type] = case` and `activity[switch.type] = checkWorkflowVar` or `activity[switch.type] = case` and `activity[switch.type] = case`;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; `activity[switch.type] = if`;

### execution

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; `activity[switch.type] = checkWorkflowVar` or `activity[switch.type] = case` or `activity[switch.type] = if`;

### serverSideCondition

- `type` — `<STRING>`; —; No; —; `<enum:[rowsReturned:"Rows returned", noRowsReturned:"No Rows returned", expression:"Expression", functionBody:"Function Body", variable=value:"Variable = Value", variable!=value:"Variable != Value", variableIsNull:"Variable is NULL", variableIsNotNull:"Variable is NOT NULL", variableIsZero:"Variable is zero", variableIsNotZero:"Variable is NOT zero", variableIsNullOrZero:"Variable is NULL or zero", variableIsNotNullAndNotZero:"Variable is NOT NULL and NOT zero", variableContainsNoSpaces:"Variable contains no spaces", variableIsNumeric:"Variable is numeric", variableIsNotNumeric:"Variable is NOT numeric", variableIsAlphanumeric:"Variable is alphanumeric", variableIsInColonDelimitedList:"Variable is in colon delimited list", variableIsNotInColonDelimitedList:"Variable is NOT in colon delimited list", textIsContainedInVariable:"Text is contained in Variable", text=value:"Text = Value", text!=value:"Text != Value", textIsContainedInValue:"Text is contained in Value", textIsNotContainedInValue:"Text is NOT contained in Value", never:"Never"]>`; —; `activity[switch.type] = if`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = if` and `connection[serverSideCondition.type] = rowsReturned` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = noRowsReturned`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=4000, textCase=UPPER; `activity[switch.type] = if` and `connection[serverSideCondition.type] = variable=value` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variable!=value` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsNull` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsNotNull` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsZero` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsNotZero` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsNullOrZero` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsNotNullAndNotZero` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableContainsNoSpaces` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsNumeric` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsNotNumeric` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsAlphanumeric` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsInColonDelimitedList` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsNotInColonDelimitedList` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = textIsContainedInVariable`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsInColonDelimitedList` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variableIsNotInColonDelimitedList`;
- `text` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = if` and `connection[serverSideCondition.type] = textIsContainedInVariable` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = textIsContainedInValue` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = textIsNotContainedInValue` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = text=value` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = text!=value`;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = if` and `connection[serverSideCondition.type] = variable=value` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = variable!=value` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_EQ_COND_2` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = VALUE_OF_ITEM_IN_COND_1_NOT_EQ_COND_2` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = textIsContainedInValue` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = textIsNotContainedInValue` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = text=value` or `activity[switch.type] = if` and `connection[serverSideCondition.type] = text!=value`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `activity[switch.type] = if` and `connection[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `activity[switch.type] = if` and `connection[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = if` and `connection[serverSideCondition.type] = expression` and `connection[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = if` and `connection[serverSideCondition.type] = expression` and `connection[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = if` and `connection[serverSideCondition.type] = expression` and `connection[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = if` and `connection[serverSideCondition.type] = functionBody` and `connection[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[switch.type] = if` and `connection[serverSideCondition.type] = functionBody` and `connection[serverSideCondition.language] = javaScript-mle`;

