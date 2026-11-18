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

- `master` — `<@templateOption>`; —; No; —; `<enum:[@/8842.261/universal-theme/required-above/indicator-asterisk, @/8842.261/universal-theme/required-above/indicator-label, @/8842.261/universal-theme/required-floating/indicator-asterisk, @/8842.261/universal-theme/required-floating/indicator-label, @/8842.261/universal-theme/required/indicator-asterisk, @/8842.261/universal-theme/required/indicator-label]>`; —; —;
- `master` — `<@templateOption>`; —; No; —; —; lovType=COMPONENT; —;

### appearance

- `cssClasses` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

