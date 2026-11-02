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

- `master` — `<@templateOption>`; —; No; —; `<enum:[@/8842.261/universal-theme/blank/contain-body-content, @/8842.261/universal-theme/drawer/drawer-size-extra-large, @/8842.261/universal-theme/drawer/drawer-size-large, @/8842.261/universal-theme/drawer/drawer-size-medium, @/8842.261/universal-theme/drawer/drawer-size-small, @/8842.261/universal-theme/drawer/position-bottom, @/8842.261/universal-theme/drawer/position-end, @/8842.261/universal-theme/drawer/position-start, @/8842.261/universal-theme/drawer/position-top, @/8842.261/universal-theme/drawer/remove-body-padding, @/8842.261/universal-theme/left-and-right-side-columns/sticky-header-on-mobile, @/8842.261/universal-theme/left-side-column/sticky-header-on-mobile, @/8842.261/universal-theme/login/page-background-1, @/8842.261/universal-theme/login/page-background-2, @/8842.261/universal-theme/login/page-background-3, @/8842.261/universal-theme/login/page-layout-split, @/8842.261/universal-theme/marquee/sticky-header-on-mobile, @/8842.261/universal-theme/minimal-no-navigation/sticky-header-on-mobile, @/8842.261/universal-theme/modal-dialog/remove-body-padding, @/8842.261/universal-theme/modal-dialog/stretch-to-fit-window, @/8842.261/universal-theme/right-side-column/sticky-header-on-mobile, @/8842.261/universal-theme/standard/sticky-header-on-mobile, @/8842.261/universal-theme/wizard-modal-dialog/remove-body-padding, @/8842.261/universal-theme/wizard-modal-dialog/stretch-to-fit-window]>`; —; —;
- `master` — `<@templateOption>`; —; No; —; —; lovType=COMPONENT; —;

### appearance

- `cssClasses` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

