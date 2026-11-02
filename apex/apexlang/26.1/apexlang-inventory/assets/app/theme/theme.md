# theme

- componentType: `theme`
- identifierRequired: true
- filePath: `shared-components/themes/<name>/theme.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `themeNumber` — `<INTEGER>`; —; No; —; —; —; —;
- `baseTheme` — `<STRING>`; —; No; —; `<enum:[ut-24.2:"Universal Theme 24.2", ut-26.1:"Universal Theme 26.1"]>`; —; —;
- `version` — `<STRING>`; —; No; —; —; maxLength=30; `theme[subscription.master] = sample`;

### style

- `currentThemeStyle` — `<@style>`; —; No; —; —; lovType=COMPONENT; —;

### javaScript

- `fileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `identifier` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; —;
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

- `fileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### subscription

- `master` — `<@theme>`; —; No; —; `<enum:[@/8842.261/universal-theme]>`; —; —;

### description

- `description` — `<STRING>`; —; No; —; —; maxLength=4000; —;

