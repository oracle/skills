# style

- componentType: `style`
- identifierRequired: true

## Properties

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `endUserCanPick` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `accessibilityTested` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### css

- `cssClasses` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `fileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### themeRollerAttributes

- `readOnly` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `inputParameterFileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `outputCssFileUrl` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `jsonConfig` — `<STRING>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### subscription

- `master` — `<@style>`; —; No; —; `<enum:[@/8842.261/universal-theme/Vita, @/8842.261/universal-theme/iris, @/8842.261/universal-theme/redwood-light, @/8842.261/universal-theme/vita-dark, @/8842.261/universal-theme/vita-red, @/8842.261/universal-theme/vita-slate]>`; —; —;
- `master` — `<@style>`; —; No; —; —; lovType=COMPONENT; —;

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=30; —;

