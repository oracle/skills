# restEnabledSqlDatabase

- componentType: `restEnabledSqlDatabase`
- identifierRequired: true
- filePath: `workspace-components/remote-databases/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a descriptive name for this REST Enabled SQL Service.; Yes; —; —; maxLength=255; —;

### databaseSession

- `initPlsqlCode` — `<STRING>`; Enter code to be executed immediately after connecting to the REST Enabled SQL Service and before the component SQL is being executed.; No; —; —; maxLength=4000; —;
- `cleanupPlsqlCode` — `<STRING>`; Enter code to be executed immediately after the component SQL is being executed.; No; —; —; maxLength=4000; —;

### advanced

- `promptOnInstall` — `<BOOLEAN>`; Choose whether prompts for this REST Enabled SQL Service should be displayed when the application is being imported on another Application Express instance.; Yes; `N`; —; —; —;
- `httpsHostName` — `<STRING>`; The host name to be matched against the common name (CN) of the remote server's certificate for an HTTPS request. It can also be a domain name like *.example.com. If NULL, the host name in the given URL will be used.; No; —; —; maxLength=500; —;
- `serverTimeZone` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `staticId` — `<STRING>`; Use the Static ID to reference the REST Enabled SQL Service in API Calls. Static IDs are also used to identify an existing REST Enabled SQL Service when the application is being exported and imported to another workspace.; Yes; —; —; maxLength=255; —;
- `ordsVersion` — `<STRING>`; —; No; —; —; maxLength=255; —;

### endpointUrl

- `url` — `<STRING>`; Enter the endpoint URL for this REST Enabled SQL Service. Include the ORDS context root and schema URL prefix, e.g. https://{host}:{port}/ords/{schema}. Do not append /_/sql\; Application Express will take care of that.; Yes; —; —; maxLength=4000; —;

### authentication

- `credentials` — `<@webCredential>`; —; Yes; —; —; lovType=COMPONENT; —;

### database

- `databaseType` — `<STRING>`; —; No; —; `<enum:[oracle:"Oracle", mysql:"MySQL"]>`; —; —;
- `databaseInfo` — `<STRING>`; —; No; —; —; maxLength=4000; `restEnabledSqlDatabase[database.databaseType] = sample`;

### dynamicConfig

- `plsqlCode` — `<STRING>`; A procedure which configures the Endpoint URL at runtime can be defined here.; No; —; —; maxLength=32000; —;
- `procedureName` — `<STRING>`; Enter the name of a procedure which configures the Endpoint URL at runtime. This can be a stored procedure or a procedure defined in item PL/SQL Code. The code below is for an application that implements multi-tenancy and supports different variations of Endpoint URL for the tenants. It changes the domain name in the URL, depending on the customer (Example URLs: https://cust-01.example.com, https://cust-02.example.com): ; No; —; —; maxLength=255; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### session

- `mysqlSqlModes` — `<STRING>`; —; No; —; —; maxLength=4000; `restEnabledSqlDatabase[database.databaseType] = mysql`;
- `defaultSchema` — `<STRING>`; —; No; —; —; maxLength=255; `restEnabledSqlDatabase[database.databaseType] = mysql`;

