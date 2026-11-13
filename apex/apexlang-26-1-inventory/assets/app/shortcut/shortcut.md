# shortcut

- componentType: `shortcut`
- identifierRequired: true
- filePath: `shared-components/shortcuts.apx`

## Properties

### source

- `type` — `<STRING>`; —; Yes; `HTML_TEXT`; `<enum:[functionBody:"Function Body returning VARCHAR2", htmlText:"HTML Text", htmlEscapeSpecialChars:"HTML Text with Escaped Special Chars", image:"Image", jsEscapeSingleQuotes:"Text with JavaScript Escaped Single Quotes", message:"Message", jsMessageEscapeSingleQuotes:"Message with JavaScript Escaped Single Quotes"]>`; —; —;
- `htmlCode` — `<STRING>`; —; Yes; —; —; —; `shortcut[source.type] = htmlText` or `shortcut[source.type] = htmlEscapeSpecialChars`;
- `text` — `<STRING>`; —; Yes; —; —; —; `shortcut[source.type] = jsEscapeSingleQuotes`;
- `messageName` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `shortcut[source.type] = message` or `shortcut[source.type] = jsMessageEscapeSingleQuotes`;
- `imageUrl` — `<STRING>`; —; Yes; —; —; maxLength=255; `shortcut[source.type] = image`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `shortcut[source.type] = functionBody`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `shortcut[source.type] = functionBody` and `shortcut[source.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `shortcut[source.type] = functionBody` and `shortcut[source.language] = javaScript-mle`;

### subscription

- `master` — `<@shortcut>`; —; No; —; —; lovType=COMPONENT; —;

### identification (direct group)

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### error

- `errorMessage` — `<STRING>`; —; No; —; —; maxLength=4000; —;

