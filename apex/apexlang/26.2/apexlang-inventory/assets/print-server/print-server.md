# printServer

- componentType: `printServer`
- identifierRequired: true
- filePath: `workspace-components/print-servers/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a descriptive name for this Print Server.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; `BIP`; `<enum:[oracleBiPublisher:"Oracle BI Publisher", apacheFop:"Apache FOP", apexOfficePrint:"APEX Office Print", documentGenerator:"Oracle Document Generator Pre-built Function"]>`; —; —;

### advanced

- `promptOnInstall` — `<BOOLEAN>`; Choose whether prompts for this Print Server should be displayed when the application is being imported on another Application Express instance.; Yes; `N`; —; —; —;
- `serverTimeout` — `<INTEGER>`; —; Yes; `300`; —; —; —;
- `httpsHostName` — `<STRING>`; The host name to be matched against the common name (CN) of the remote server's certificate for an HTTPS request. It can also be a domain name like *.example.com. If NULL, the host name in the given URL will be used.; No; —; —; maxLength=500; —;
- `staticId` — `<STRING>`; Use the Static ID to reference the Print Server in API Calls. Static IDs are also used to identify an existing Print Server when the application is being exported and imported to another workspace.; Yes; —; —; maxLength=255; —;

### endpointUrl

- `url` — `<STRING>`; Enter the endpoint URL for this Print Server.; Yes; —; —; maxLength=4000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

