# theme

- componentType: `theme`
- identifierRequired: true
- filePath: `shared-components/themes/<name>/theme.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Provides a short descriptive name for the theme.; Yes; —; —; maxLength=255; —;
- `themeNumber` — `<INTEGER>`; —; No; —; —; —; —;
- `baseTheme` — `<STRING>`; —; No; —; `<enum:[ut-24.2:"Universal Theme 24.2", ut-26.1:"Universal Theme 26.1", ut-26.2:"Universal Theme 26.2"]>`; —; —;
- `version` — `<STRING>`; —; No; —; —; maxLength=30; `theme[subscription.master] = sample`;

### style

- `currentThemeStyle` — `<@style>`; —; No; —; —; lovType=COMPONENT; —;

### javaScript

- `fileUrls` — `<STRING>`; Enter JavaScript file URLs for code to be loaded on every page. Each URL has to be written into a new line. If you provide a minified version of your file, you can use the substitution string #MIN# to include .min or #MIN_DIRECTORY# to include minified/ in your file URL for a regular page view and an empty string if the page is viewed in debug mode. JavaScript file URLs you enter here replaces the #THEME_JAVASCRIPT# substitution string in the page template. Note: You do not need to include opening or closing script tags. Just write the URL.; No; —; —; maxLength=4000; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `identifier` — `<STRING>`; Specifies the internal theme identifier.; Yes; —; —; maxLength=255, textCase=UPPER; —;
- `filePrefix` — `<STRING>`; —; No; —; —; maxLength=255; —;

### navigation

- `type` — `<STRING>`; —; Yes; `L`; `<enum:[tabs:"Tabs", list:"List"]>`; —; —;
- `navigationBarType` — `<STRING>`; —; Yes; `LIST`; `<enum:[classic:"Classic", list:"List"]>`; —; —;

### componentDefaults

- `page` — `<@pageTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `navigationBarList` — `<@listTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `navigationMenuListPosition` — `<STRING>`; —; Yes; `TOP`; `<enum:[top:"Top", side:"Side"]>`; —; —;
- `navigationMenuListTop` — `<@listTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `navigationMenuListSide` — `<@listTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `loginPage` — `<@pageTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `errorPage` — `<@pageTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `printerFriendlyPage` — `<@pageTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `breadcrumb` — `<@breadcrumbTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `button` — `<@buttonTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `defaultLabel` — `<@fieldTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `optionalLabel` — `<@fieldTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `requiredLabel` — `<@fieldTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `list` — `<@listTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `region` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `classicReport` — `<@classicReportTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `headerToolbar` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `footerToolbar` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;

### regionDefaults

- `breadcrumbs` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `charts` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `forms` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `lists` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `reports` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `wizards` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `interactiveReports` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;

### dialogDefaults

- `dialogContentRegion` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `dialogButtonRegion` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;
- `dialogPage` — `<@pageTemplate>`; —; No; —; —; lovType=COMPONENT; —;

### icons

- `library` — `<STRING>`; —; No; —; `<enum:[fontApex:"Font APEX", fontApexLatest:"Font APEX - Latest"]>`; —; —;
- `customLibraryFileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `customClasses` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `customPrefixClass` — `<STRING>`; —; No; —; —; maxLength=30; —;
- `datePickerIconName` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `datePickerIconAttributes` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### css

- `fileUrls` — `<STRING>`; Enter Cascading Style Sheet file URLs to be loaded on every page. Each URL has to be written into a new line. If you provide a minified version of your file you can use the substitution string #MIN# to include .min or #MIN_DIRECTORY# to include minified/ in your file URL for a regular page view and an empty string if the page is viewed in debug mode. You also have access to the substitution string #APP_VERSION# if you want to include the application's version in the file URL. File URLs you enter here will replace the #THEME_CSS# substitution string in the page template. Note: You do not need to include opening or closing link tags. Just include the file URL.; No; —; —; maxLength=4000; —;

### subscription

- `master` — `<@theme>`; —; No; —; `<enum:[@/8842.262/universal-theme]>`; —; —;

### description

- `description` — `<STRING>`; Provides a short description for the theme.; No; —; —; maxLength=4000; —;

