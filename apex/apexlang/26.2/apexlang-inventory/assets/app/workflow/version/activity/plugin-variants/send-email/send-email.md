# plugin-variants/sendEMail

- componentType: `activity`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a name for the workflow activity.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[sendEMail:"Send E-Mail"]>`; —; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `label` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `diagram` — `<STRING>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### layout

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;

### emailHeader

- `cc` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `from` — `<STRING>`; —; Yes; `&APP_EMAIL.`; —; maxLength=4000; —;
- `to` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `bcc` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### emailContent

- `replyTo` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `subject` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `bodyHtml` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `bodyPlainText` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

### emailAttachments

- `attachmentSql` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### emailDispatchMode

- `sendImmediately` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### emailTemplate

- `emailTemplate` — `<@emailTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `placeholderValues` — `<STRING>`; —; No; —; —; maxLength=4000; `activity[emailTemplate.emailTemplate] = sample`;
- `languageOverride` — `<STRING>`; —; No; —; —; maxLength=128; `activity[emailTemplate.emailTemplate] = sample`;
- `escapeBodySubstitutions` — `<STRING>`; —; No; `HTML`; `<enum:[false:"No", true:"Yes"]>`; maxLength=4000; `activity[emailContent.bodyHtml] = sample`;

### source

- `location` — `<STRING>`; —; Yes; `LOCAL`; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL"]>`; —; —;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `activity[source.location] = restEnabledSql`;
- `plsqlCode` — `<STRING>`; Enter the PL/SQL code to be executed on the remote database.; Yes; —; —; —; `activity[source.location] = restEnabledSql`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `activity[source.location] = localDatabase`;
- `plsqlCode` — `<STRING>`; —; Yes; —; —; —; `activity[source.location] = localDatabase` and `activity[source.language] = plsql`;
- `javaScriptCode` — `<STRING>`; —; Yes; —; —; —; `activity[source.location] = localDatabase` and `activity[source.language] = javaScript-mle`;

### deadline

- `dueOnType` — `<STRING>`; —; No; —; `<enum:[interval:"Interval", sqlQuery:"SQL Query", expression:"Expression", functionBody:"Function Body", schedulerExpression:"Scheduler Expression"]>`; —; —;
- `interval` — `<STRING>`; —; Yes; —; —; maxLength=255; `activity[deadline.dueOnType] = interval`;
- `schedulerExpression` — `<STRING>`; —; Yes; —; —; maxLength=255; `activity[deadline.dueOnType] = schedulerExpression`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = sqlQuery`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `activity[deadline.dueOnType] = expression`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `activity[deadline.dueOnType] = functionBody`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = expression` and `activity[deadline.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = expression` and `activity[deadline.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = expression` and `activity[deadline.language] = javaScript-mle`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = functionBody` and `activity[deadline.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `activity[deadline.dueOnType] = functionBody` and `activity[deadline.language] = javaScript-mle`;

### additionalData

- `sqlQuery` — `<STRING>`; Enter a SQL query to read additional data.                 The column names of the query can be used as bind variables and substitution                 strings to evaluate conditions or activity variables during the execution of the activity.                 The result of the query should contain only one row.                  If the query returns no result or more than one row then the activity fails during execution.; No; —; —; maxLength=4000; —;

### parallelFlow

- `branch` — `<@branch>`; —; No; —; —; lovType=COMPONENT; —;

### genAI

- `enabled` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `agent` — `<@aiAgent>`; —; No; —; —; lovType=COMPONENT; `activity[genAI.enabled] = Y`;
- `service` — `<@genAIService>`; —; No; —; —; lovType=COMPONENT; `activity[genAI.enabled] = Y`;
- `systemPrompt` — `<STRING>`; —; No; —; —; —; `activity[genAI.enabled] = Y`;

