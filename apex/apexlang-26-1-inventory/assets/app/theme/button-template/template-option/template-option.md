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

- `master` — `<@templateOption>`; —; No; —; `<enum:[@/8842.261/universal-theme/icon/push, @/8842.261/universal-theme/icon/spin, @/8842.261/universal-theme/text-with-icon/hide-icon-on-desktop, @/8842.261/universal-theme/text-with-icon/hide-label-on-mobile, @/8842.261/universal-theme/text-with-icon/lefticon, @/8842.261/universal-theme/text-with-icon/push, @/8842.261/universal-theme/text-with-icon/righticon, @/8842.261/universal-theme/text-with-icon/spin]>`; —; —;
- `master` — `<@templateOption>`; —; No; —; —; lovType=COMPONENT; —;

### appearance

- `cssClasses` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

