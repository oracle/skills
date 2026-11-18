# fieldTemplate

- componentType: `fieldTemplate`
- identifierRequired: true
- filePath: `shared-components/themes/<name>/field-templates/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The display name of this template.; Yes; —; —; maxLength=255; —;
- `templateClass` — `<STRING>`; —; No; —; `<enum:[noLabel:"No Label", optionalLabel:"Optional Label", optionalLabelWithHelp:"Optional Label with Help", requiredLabel:"Required Label", requiredLabelWithHelp:"Required Label with Help", custom1:"Custom 1", custom2:"Custom 2", custom3:"Custom 3", custom4:"Custom 4", custom5:"Custom 5", custom6:"Custom 6", custom7:"Custom 7", custom8:"Custom 8"]>`; —; —;

### advanced

- `translatable` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `identifier` — `<STRING>`; —; No; —; —; maxLength=255; —;

### templateOptions

- `preset` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;
- `default` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;

### subscription

- `master` — `<@fieldTemplate>`; —; No; —; `<enum:[@/8842.262/universal-theme/hidden, @/8842.262/universal-theme/optional, @/8842.262/universal-theme/optional-above, @/8842.262/universal-theme/optional-floating, @/8842.262/universal-theme/required, @/8842.262/universal-theme/required-above, @/8842.262/universal-theme/required-floating]>`; —; —;
- `master` — `<@fieldTemplate>`; —; No; —; —; lovType=COMPONENT; —;

### label

- `before` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `after` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### item

- `before` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `after` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `preText` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `postText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### help

- `invoke` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `inline` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### error

- `beforeLabel` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `afterLabel` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `errorTemplate` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### fieldContainer

- `beforeLabelAndItem` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `afterLabelAndItem` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

