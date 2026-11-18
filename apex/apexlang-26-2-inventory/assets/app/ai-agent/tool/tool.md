# tool

- componentType: `tool`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=64, textCase=LOWER; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[executeClientsideCode:"Execute Client-side Code", executeClientsideCode:"Execute Client-side Code", executeServersideCode:"Execute Server-side Code", executeServersideCode:"Execute Server-side Code", retrieveData:"Retrieve Data", retrieveData:"Retrieve Data"]>`; —; —;
- `executionPoint` — `<STRING>`; —; Yes; —; `<enum:[augmentSystemPrompt:"Augment System Prompt", onDemand:"On Demand"]>`; —; —;
- `description` — `<STRING>`; —; No; —; —; maxLength=4000; `tool[identification.executionPoint] = onDemand`;

### advanced

- `staticId` — `<STRING>`; Enter a unique Static ID to identify this component in API calls or refer to it in application export files. If you change the Static ID, dependent components will retain their references, but any existing API calls using the old ID must be updated manually.; Yes; —; —; maxLength=255; —;

### security

- `authorizationScheme` — `<@authorization>`; —; No; —; `<enum:[mustNotBePublicUser:"MODEL.LOV.MUST_NOT_BE_PUBLIC_USER"]>`; —; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### serverSideCondition

- `type` — `<STRING>`; Select a condition type that must be met in order for the Augment System Prompt tool to be executed, or the On Demand tool to be made available to the AI Service. For the condition types Any User Prompt contains and Last User Prompt contains, provide a comma-separated list of words to check for their presence in the user's prompt. In programmatic contexts, you can use the following special bind variables to access and evaluate the user's prompt: APEX$AI_LAST_USER_PROMPT: Contains the most recent user-entered prompt. APEX$AI_ALL_USER_PROMPTS: Contains all user prompts, concatenated into a single string.; No; —; `<enum:[anyUserPromptContains:"Any User Prompt contains", lastUserPromptContains:"Last User Prompt contains", rowsReturned:"Rows returned", noRowsReturned:"No Rows returned", expression:"Expression", functionBody:"Function Body", never:"Never"]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `tool[serverSideCondition.type] = rowsReturned` or `tool[serverSideCondition.type] = noRowsReturned`;
- `list` — `<STRING>`; —; Yes; —; —; maxLength=4000; `tool[serverSideCondition.type] = anyUserPromptContains` or `tool[serverSideCondition.type] = lastUserPromptContains`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `tool[serverSideCondition.type] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `tool[serverSideCondition.type] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `tool[serverSideCondition.type] = expression` and `tool[serverSideCondition.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `tool[serverSideCondition.type] = expression` and `tool[serverSideCondition.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `tool[serverSideCondition.type] = expression` and `tool[serverSideCondition.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `tool[serverSideCondition.type] = functionBody` and `tool[serverSideCondition.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `tool[serverSideCondition.type] = functionBody` and `tool[serverSideCondition.language] = javaScript-mle`;

### notification

- `message` — `<STRING>`; —; No; —; —; maxLength=4000; `tool[identification.executionPoint] = onDemand`;
- `type` — `<STRING>`; —; No; —; `<enum:[info:"Info", success:"Success"]>`; —; `tool[identification.executionPoint] = onDemand` and `tool[notification.message] = sample`;

### userApproval

- `requiresConfirmation` — `<BOOLEAN>`; —; Yes; `N`; —; —; `tool[identification.executionPoint] = onDemand`;
- `title` — `<STRING>`; —; No; —; —; maxLength=255; `tool[identification.executionPoint] = onDemand` and `tool[userApproval.requiresConfirmation] = Y`;
- `message` — `<STRING>`; —; Yes; —; —; maxLength=4000; `tool[identification.executionPoint] = onDemand` and `tool[userApproval.requiresConfirmation] = Y`;
- `confirmLabel` — `<STRING>`; —; No; —; —; maxLength=255; `tool[identification.executionPoint] = onDemand` and `tool[userApproval.requiresConfirmation] = Y`;
- `cancelLabel` — `<STRING>`; —; No; —; —; maxLength=255; `tool[identification.executionPoint] = onDemand` and `tool[userApproval.requiresConfirmation] = Y`;

