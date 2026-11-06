# fileServer

- componentType: `fileServer`
- identifierRequired: true
- filePath: `workspace-components/file-servers/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### advanced

- `promptOnInstall` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `httpsHostName` — `<STRING>`; —; No; —; —; maxLength=500; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### endpointUrl

- `url` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

### authentication

- `credentials` — `<@webCredential>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

