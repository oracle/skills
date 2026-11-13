# appSetting

- componentType: `appSetting`
- identifierRequired: true

## Properties

### validation

- `required` — `<BOOLEAN>`; Specify whether this application setting is required and must always be set.; Yes; `N`; —; —; —;
- `validValues` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### value

- `staticValue` — `<STRING>`; Enter the default value for this application setting.; No; —; —; maxLength=4000; —;
- `onUpgradeKeepValue` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### identification (direct group)

- `staticId` — `<STRING>`; Enter a unique Static ID for this application setting. Application settings enable developers to define application-level configuration options. The Static ID is used to identify this component in API calls or to refer to it in application export files. If you change the Static ID, dependent components will retain their references, but any existing API calls using the old ID must be updated manually.; Yes; —; —; maxLength=255; —;

### subscription

- `master` — `<@appSetting>`; —; No; —; —; lovType=COMPONENT; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

