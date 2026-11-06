# pageTemplate

- componentType: `pageTemplate`
- identifierRequired: true
- filePath: `shared-components/themes/<name>/page-templates/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The display name of this template.; Yes; —; —; maxLength=255; —;
- `templateClass` — `<STRING>`; —; No; —; `<enum:[login:"Login", noTabs:"No Tabs", noTabsWithSidebar:"No Tabs with Sidebar", oneLevelTabs:"One Level Tabs", oneLevelTabsWithSidebar:"One Level Tabs with Sidebar", popup:"Popup", printerFriendly:"Printer Friendly", twoLevelTabs:"Two Level Tabs", twoLevelTabsWithSidebar:"Two Level Tabs with Sidebar", custom1:"Custom 1", custom2:"Custom 2", custom3:"Custom 3", custom4:"Custom 4", custom5:"Custom 5", custom6:"Custom 6", custom7:"Custom 7", custom8:"Custom 8"]>`; —; —;

### javaScript

- `fileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `functionAndGlobalVariableDeclaration` — `<STRING>`; —; No; —; —; —; —;
- `executeWhenPageLoads` — `<STRING>`; —; No; —; —; —; —;

### advanced

- `translatable` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `identifier` — `<STRING>`; —; No; —; —; maxLength=255; —;

### templateOptions

- `preset` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;
- `default` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;

### page

- `type` — `<STRING>`; —; Yes; `N`; `<enum:[dialog:"Dialog Page", normal:"Normal Page"]>`; —; —;
- `header` — `<STRING>`; —; Yes; —; —; —; —;
- `body` — `<STRING>`; —; Yes; —; —; —; —;
- `footer` — `<STRING>`; —; No; —; —; —; —;

### subscription

- `master` — `<@pageTemplate>`; —; No; —; `<enum:[@/8842.262/universal-theme/blank, @/8842.262/universal-theme/drawer, @/8842.262/universal-theme/left-and-right-side-columns, @/8842.262/universal-theme/left-side-column, @/8842.262/universal-theme/login, @/8842.262/universal-theme/marquee, @/8842.262/universal-theme/minimal-no-navigation, @/8842.262/universal-theme/modal-dialog, @/8842.262/universal-theme/right-side-column, @/8842.262/universal-theme/standard, @/8842.262/universal-theme/wizard-modal-dialog]>`; —; —;
- `master` — `<@pageTemplate>`; —; No; —; —; lovType=COMPONENT; —;

### subtemplate

- `successMessage` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `navigationBar` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `navigationBarEntry` — `<STRING>`; —; No; —; —; —; —;
- `notification` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### imageBasedTab

- `current` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `nonCurrent` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### layout

- `type` — `<STRING>`; —; Yes; `FIXED`; `<enum:[htmlTable:"HTML Table", fixedNumberOfColumns:"Fixed Number of Columns", variableNumberOfColumns:"Variable Number of Columns"]>`; —; —;
- `maxColumns` — `<INTEGER>`; —; No; —; —; —; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;
- `alwaysUseMaxColumns` — `<BOOLEAN>`; —; Yes; `N`; —; —; `pageTemplate[layout.type] = fixedNumberOfColumns`;
- `hasColumnSpan` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;
- `alwaysRenderLayout` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;
- `emitEmptyLeadingColumns` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;
- `emitEmptyTrailingColumns` — `<BOOLEAN>`; —; Yes; `N`; —; —; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;
- `defaultLabelColumnSpan` — `<INTEGER>`; —; No; —; —; —; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;
- `firstColumnAttributes` — `<STRING>`; —; No; —; —; maxLength=255; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;
- `lastColumnAttributes` — `<STRING>`; —; No; —; —; maxLength=255; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;
- `regionTableAttributes` — `<STRING>`; —; No; —; —; maxLength=255; `pageTemplate[layout.type] = htmlTable`;
- `containerTemplate` — `<STRING>`; —; No; —; —; maxLength=4000; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;
- `rowTemplate` — `<STRING>`; —; No; —; —; maxLength=4000; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;
- `columnTemplate` — `<STRING>`; —; No; —; —; maxLength=4000; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;
- `javaScriptDebugCode` — `<STRING>`; —; No; —; —; maxLength=4000; `pageTemplate[layout.type] = fixedNumberOfColumns` or `pageTemplate[layout.type] = variableNumberOfColumns`;

### positions

- `breadcrumbPosition` — `<STRING>`; —; No; —; —; lovType=SLOTS; —;
- `sidebarPosition` — `<STRING>`; —; No; —; —; lovType=SLOTS; —;

### errorPage

- `template` — `<STRING>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### css

- `fileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `inline` — `<STRING>`; —; No; —; —; —; —;

### dialog

- `initCode` — `<STRING>`; —; No; —; —; maxLength=4000; `pageTemplate[page.type] = dialog`;
- `closureCode` — `<STRING>`; —; No; —; —; maxLength=4000; `pageTemplate[page.type] = dialog`;
- `cancelCode` — `<STRING>`; —; No; —; —; maxLength=4000; `pageTemplate[page.type] = dialog`;
- `allowEmbedInFrame` — `<STRING>`; —; No; —; `<enum:[modal:"Modal Dialog", nonModal:"Non-Modal Dialog"]>`; —; `pageTemplate[page.type] = dialog`;
- `height` — `<STRING>`; —; No; —; —; maxLength=20; `pageTemplate[page.type] = dialog`;
- `width` — `<STRING>`; —; No; —; —; maxLength=20; `pageTemplate[page.type] = dialog`;
- `maxWidth` — `<STRING>`; —; No; —; —; maxLength=20; `pageTemplate[page.type] = dialog`;
- `cssClasses` — `<STRING>`; —; No; —; —; maxLength=255; `pageTemplate[page.type] = dialog`;

### standardTab

- `current` — `<STRING>`; —; No; —; —; maxLength=4000; `theme[navigation.type] = tabs`;
- `currentFontAttributes` — `<STRING>`; —; No; —; —; maxLength=255; `theme[navigation.type] = tabs`;
- `nonCurrent` — `<STRING>`; —; No; —; —; maxLength=4000; `theme[navigation.type] = tabs`;
- `nonCurrentFontAttributes` — `<STRING>`; —; No; —; —; maxLength=255; `theme[navigation.type] = tabs`;

### parentTab

- `current` — `<STRING>`; —; No; —; —; maxLength=4000; `theme[navigation.type] = tabs`;
- `currentFontAttributes` — `<STRING>`; —; No; —; —; maxLength=255; `theme[navigation.type] = tabs`;
- `nonCurrent` — `<STRING>`; —; No; —; —; maxLength=4000; `theme[navigation.type] = tabs`;
- `nonCurrentFontAttributes` — `<STRING>`; —; No; —; —; maxLength=255; `theme[navigation.type] = tabs`;

