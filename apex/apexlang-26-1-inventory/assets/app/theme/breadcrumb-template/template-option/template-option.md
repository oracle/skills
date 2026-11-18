# templateOption

- componentType: `templateOption`
- identifierRequired: true

## Properties

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `isAdvancedOption` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `identifier` — `<STRING>`; —; No; —; —; maxLength=255; —;

### help

- `helpText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### identification (direct group)

- `group` — `<@templateOptionGroup>`; —; No; —; —; lovType=COMPONENT; —;
- `sequence` — `<INTEGER>`; —; Yes; —; —; —; —;
- `name` — `<STRING>`; —; Yes; —; —; maxLength=30; —;

### subscription

- `master` — `<@templateOption>`; —; No; —; —; lovType=COMPONENT; —;

### appearance

- `cssClasses` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

