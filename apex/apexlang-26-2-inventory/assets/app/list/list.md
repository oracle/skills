# list

- componentType: `list`
- identifierRequired: true
- filePath: `shared-components/lists/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a unique name for the list.; Yes; —; —; maxLength=255; —;

### source

- `type` — `<STRING>`; —; Yes; `STATIC`; `<enum:[staticValues:"Static Values", sqlQuery:"SQL Query", functionBody:"Function Body returning SQL Query"]>`; —; —;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `list[source.type] = sqlQuery`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `list[source.type] = functionBody`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `list[source.type] = functionBody` and `list[source.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `list[source.type] = functionBody` and `list[source.language] = javaScript-mle`;

### subscription

- `master` — `<@list>`; —; No; —; `<enum:[@/8842.262/navigation-bar]>`; —; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

