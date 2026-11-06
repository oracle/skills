# authenticationServer

- componentType: `authenticationServer`
- identifierRequired: true
- filePath: `workspace-components/authentication-servers/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a descriptive name for this Authentication Server.; Yes; —; —; maxLength=255; —;

### advanced

- `promptOnInstall` — `<BOOLEAN>`; Choose whether prompts for this Authentication Server should be displayed when the application is being imported on another Application Express instance.; Yes; `N`; —; —; —;
- `httpsHostName` — `<STRING>`; The host name to be matched against the common name (CN) of the remote server's certificate for an HTTPS request. It can also be a domain name like *.example.com. If NULL, the host name in the given URL will be used.; No; —; —; maxLength=500; —;
- `staticId` — `<STRING>`; Use the Static ID to reference the Authentication Server in API Calls. Static IDs are also used to identify an existing Authentication Server when the application is being exported and imported to another workspace.; Yes; —; —; maxLength=255; —;

### endpointUrl

- `url` — `<STRING>`; Enter the endpoint URL for this Authentication Server.; Yes; —; —; maxLength=4000; —;

### dynamicConfig

- `plsqlCode` — `<STRING>`; A procedure which configures the Endpoint URL at runtime can be defined here.; No; —; —; maxLength=32000; —;
- `procedureName` — `<STRING>`; Enter the name of a procedure which configures the Endpoint URL at runtime. This can be a stored procedure or a procedure defined in item PL/SQL Code. The code below is for an application that implements multi-tenancy and supports different variations of Endpoint URL for the tenants. It changes the domain name in the URL, depending on the customer (Example URLs: https://cust-01.example.com, https://cust-02.example.com): ; No; —; —; maxLength=255; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

