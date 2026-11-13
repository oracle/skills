# appItem

- componentType: `appItem`
- identifierRequired: true
- filePath: `shared-components/app-items.apx`

## Properties

### security

- `sessionStateDataType` — `<STRING>`; —; Yes; `VARCHAR`; `<enum:[number:"NUMBER", varchar:"VARCHAR"]>`; —; —;
- `sessionStateProtection` — `<STRING>`; —; Yes; `I`; `<enum:[unrestricted:"Unrestricted", checksumRequiredAppLevel:"Checksum Required - Application Level", checksumRequiredUserLevel:"Checksum Required - User Level", checksumRequiredSessionLevel:"Checksum Required - Session Level", restricted:"Restricted - May not be set from browser"]>`; —; —;
- `escapeSpecialChars` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### subscription

- `master` — `<@appItem>`; —; No; —; —; lovType=COMPONENT; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### identification (direct group)

- `scope` — `<STRING>`; —; Yes; `APP`; `<enum:[app:"Application", global:"Global"]>`; —; —;
- `name` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

