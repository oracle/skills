# authenticationServer

- componentType: `authenticationServer`
- identifierRequired: true
- filePath: `workspace-components/authentication-servers/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### advanced

- `promptOnInstall` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `httpsHostName` — `<STRING>`; —; No; —; —; maxLength=500; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### endpointUrl

- `url` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

### dynamicConfig

- `plsqlCode` — `<STRING>`; —; No; —; —; maxLength=32000; —;
- `procedureName` — `<STRING>`; —; No; —; —; maxLength=255; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

