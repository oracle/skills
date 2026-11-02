# templateOptionGroup

- componentType: `templateOptionGroup`
- identifierRequired: true
- filePath: `shared-components/themes/<name>/template-option-groups.apx`

## Properties

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `isAdvancedOption` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `identifier` — `<STRING>`; Deprecated. Specifies the internal name of this template option group.; No; —; —; maxLength=255; —;

### help

- `helpText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### identification (direct group)

- `templateType` — `<STRING>`; —; Yes; —; `<enum:[button:"Button", item:"Item", region:"Region", report:"Report", list:"List", page:"Page", breadcrumb:"Breadcrumb"]>`; —; —;
- `sequence` — `<INTEGER>`; —; Yes; —; —; —; —;
- `name` — `<STRING>`; —; Yes; —; —; maxLength=30; —;

### settings

- `nullText` — `<STRING>`; —; No; —; —; maxLength=30; —;

### subscription

- `master` — `<@templateOptionGroup>`; —; No; —; —; lovType=COMPONENT; —;

