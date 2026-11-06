# buildOption

- componentType: `buildOption`
- identifierRequired: true
- filePath: `shared-components/build-options.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### status

- `onUpgradeKeepStatus` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `status` — `<STRING>`; —; Yes; `EXCLUDE`; `<enum:[include:"Include", exclude:"Exclude"]>`; —; —;
- `defaultOnExport` — `<STRING>`; —; No; —; `<enum:[exclude:"Exclude", include:"Include"]>`; —; —;

### subscription

- `master` — `<@buildOption>`; —; No; —; —; lovType=COMPONENT; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `featureIdentifier` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

