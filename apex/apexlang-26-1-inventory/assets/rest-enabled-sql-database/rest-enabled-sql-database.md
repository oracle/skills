# restEnabledSqlDatabase

- componentType: `restEnabledSqlDatabase`
- identifierRequired: true
- filePath: `workspace-components/remote-databases/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### databaseSession

- `initPlsqlCode` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `cleanupPlsqlCode` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### advanced

- `promptOnInstall` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `httpsHostName` — `<STRING>`; —; No; —; —; maxLength=500; —;
- `serverTimeZone` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `ordsVersion` — `<STRING>`; —; No; —; —; maxLength=255; —;

### endpointUrl

- `url` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

### authentication

- `credentials` — `<@webCredential>`; —; Yes; —; —; lovType=COMPONENT; —;

### database

- `databaseType` — `<STRING>`; —; No; —; `<enum:[oracle:"Oracle", mysql:"MySQL"]>`; —; —;
- `databaseInfo` — `<STRING>`; —; No; —; —; maxLength=4000; `restEnabledSqlDatabase[database.databaseType] = sample`;

### dynamicConfig

- `plsqlCode` — `<STRING>`; —; No; —; —; maxLength=32000; —;
- `procedureName` — `<STRING>`; —; No; —; —; maxLength=255; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### session

- `mysqlSqlModes` — `<STRING>`; —; No; —; —; maxLength=4000; `restEnabledSqlDatabase[database.databaseType] = mysql`;
- `defaultSchema` — `<STRING>`; —; No; —; —; maxLength=255; `restEnabledSqlDatabase[database.databaseType] = mysql`;

