# fileServer

- componentType: `fileServer`
- identifierRequired: true
- filePath: `workspace-components/file-servers/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a descriptive name for this File Server.; Yes; —; —; maxLength=255; —;

### advanced

- `promptOnInstall` — `<BOOLEAN>`; Choose whether prompts for this File Server should be displayed when the application is being imported on another Application Express instance.; Yes; `N`; —; —; —;
- `httpsHostName` — `<STRING>`; The host name to be matched against the common name (CN) of the remote server's certificate for an HTTPS request. It can also be a domain name like *.example.com. If NULL, the host name in the given URL will be used.; No; —; —; maxLength=500; —;
- `staticId` — `<STRING>`; Use the Static ID to reference the File Server in API Calls. Static IDs are also used to identify an existing File Server when the application is being exported and imported to another workspace.; Yes; —; —; maxLength=255; —;

### endpointUrl

- `url` — `<STRING>`; Enter the endpoint URL for this File Server.; Yes; —; —; maxLength=4000; —;

### authentication

- `credentials` — `<@webCredential>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

