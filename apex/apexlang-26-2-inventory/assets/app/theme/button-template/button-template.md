# buttonTemplate

- componentType: `buttonTemplate`
- identifierRequired: true
- filePath: `shared-components/themes/<name>/button-templates/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The display name of this template.; Yes; —; —; maxLength=255; —;
- `templateClass` — `<STRING>`; —; No; —; `<enum:[button:"Button", buttonAlternative1:"Button, Alternative 1", buttonAlternative2:"Button, Alternative 2", buttonAlternative3:"Button, Alternative 3", custom1:"Custom 1", custom2:"Custom 2", custom3:"Custom 3", custom4:"Custom 4", custom5:"Custom 5", custom6:"Custom 6", custom7:"Custom 7", custom8:"Custom 8"]>`; —; —;

### advanced

- `translatable` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `identifier` — `<STRING>`; —; No; —; —; maxLength=255; —;

### subscription

- `master` — `<@buttonTemplate>`; —; No; —; `<enum:[@/8842.262/universal-theme/icon, @/8842.262/universal-theme/text, @/8842.262/universal-theme/text-with-icon]>`; —; —;
- `master` — `<@buttonTemplate>`; —; No; —; —; lovType=COMPONENT; —;

### templateOptions

- `preset` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;
- `default` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;

### button

- `normal` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `hot` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

