# popupLovTemplate

- componentType: `popupLovTemplate`
- identifierRequired: true
- filePath: `shared-components/themes/<name>/popup-lov-templates/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The display name of this template.; Yes; —; —; maxLength=255; —;
- `templateClass` — `<STRING>`; —; No; —; `<enum:[standard:"Standard"]>`; —; —;

### advanced

- `translatable` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `identifier` — `<STRING>`; —; No; —; —; maxLength=255; —;

### subscription

- `master` — `<@popupLovTemplate>`; —; No; —; `<enum:[@/8842.262/universal-theme/search-dialog]>`; —; —;
- `master` — `<@popupLovTemplate>`; —; No; —; —; lovType=COMPONENT; —;

### popupIcon

- `icon` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `attributes` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `colorPickerIcon` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `colorPickerAttributes` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### searchField

- `beforeField` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `afterField` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `width` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `maxWidth` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `filterTextAttributes` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### findButton

- `text` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `attributes` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### closeButton

- `text` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `attributes` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### nextButton

- `text` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `attributes` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### previousButton

- `text` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `attributes` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### window

- `scrollBars` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `resizable` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `width` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `height` — `<STRING>`; —; No; —; —; maxLength=255; —;

### pagination

- `text` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `rowsPerPage` — `<INTEGER>`; —; No; —; —; —; —;

### resultSet

- `before` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `after` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### page

- `head` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `bodyAttributes` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `heading` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `footer` — `<STRING>`; —; No; —; —; maxLength=4000; —;

