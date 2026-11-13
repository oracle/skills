# appSetting

- componentType: `appSetting`
- identifierRequired: true

## Properties

### validation

- `required` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `validValues` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### value

- `staticValue` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `onUpgradeKeepValue` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### identification (direct group)

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### subscription

- `master` — `<@appSetting>`; —; No; —; —; lovType=COMPONENT; —;

### config

- `buildOption` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

