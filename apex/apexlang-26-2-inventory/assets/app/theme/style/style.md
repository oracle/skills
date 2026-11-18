# style

- componentType: `style`
- identifierRequired: true

## Properties

### advanced

- `staticId` — `<STRING>`; Enter a unique Static ID to identify this component in API calls or refer to it in application export files. If you change the Static ID, dependent components will retain their references, but any existing API calls using the old ID must be updated manually.; Yes; —; —; maxLength=255; —;
- `endUserCanPick` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `accessibilityTested` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;

### css

- `cssClasses` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `fileUrls` — `<STRING>`; Enter Cascading Style Sheet file URLs to be loaded on every page if the theme style is current. Each URL has to be written into a new line. If you provide a minified version of your file you can use the substitution string #MIN# to include .min or #MIN_DIRECTORY# to include minified/ in your file URL for a regular page view and an empty string if the page is viewed in debug mode. You also have access to the substitution string #APP_VERSION# if you want to include the application's version in the file URL. File URLs you enter here will replace the #THEME_STYLE_CSS# substitution string in the page template. Note: You do not need to include opening or closing link tags. Just include the file URL.; No; —; —; maxLength=4000; —;

### themeRollerAttributes

- `readOnly` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `inputParameterFileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `outputCssFileUrl` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `jsonConfig` — `<STRING>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### subscription

- `master` — `<@style>`; —; No; —; `<enum:[@/8842.262/universal-theme/Vita, @/8842.262/universal-theme/iris, @/8842.262/universal-theme/redwood-light, @/8842.262/universal-theme/vita-dark, @/8842.262/universal-theme/vita-red, @/8842.262/universal-theme/vita-slate]>`; —; —;
- `master` — `<@style>`; —; No; —; —; lovType=COMPONENT; —;

### identification (direct group)

- `name` — `<STRING>`; Provide a short descriptive name for the theme style, to distinguish it from other styles in the theme.; Yes; —; —; maxLength=30; —;

