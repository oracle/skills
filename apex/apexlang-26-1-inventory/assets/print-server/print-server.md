# printServer

- componentType: `printServer`
- identifierRequired: true
- filePath: `workspace-components/print-servers/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; `BIP`; `<enum:[oracleBiPublisher:"Oracle BI Publisher", apacheFop:"Apache FOP", apexOfficePrint:"APEX Office Print", documentGenerator:"Oracle Document Generator Pre-built Function"]>`; —; —;

### advanced

- `promptOnInstall` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `serverTimeout` — `<INTEGER>`; —; Yes; `300`; —; —; —;
- `httpsHostName` — `<STRING>`; —; No; —; —; maxLength=500; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### endpointUrl

- `url` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

