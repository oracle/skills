# regionTemplate

- componentType: `regionTemplate`
- identifierRequired: true
- filePath: `shared-components/themes/<name>/region-templates/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The display name of this template.; Yes; —; —; maxLength=255; —;
- `templateClass` — `<STRING>`; —; No; —; `<enum:[borderlessRegion, bracketedRegion, breadcrumbRegion, buttonRegionWithTitle, buttonRegionWithoutTitle, chartRegion, formRegion, hideAndShowRegion, listRegionWithIcon, navigationRegion, navigationRegionAlternative1, regionWithoutButtonsAndTitle, regionWithoutTitle, reportFilterMultiRow, reportFilterSingleRow, reportsRegion, reportsRegion100Width, reportsRegionAlternative1, sidebarRegion, sidebarRegionAlternative1, wizardRegion, wizardRegionWithIcon, custom1, custom2, custom3, custom4, custom5, custom6, custom7, custom8]>`; —; —;

### javaScript

- `fileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `executeWhenPageLoads` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### accessibility

- `landmarkType` — `<STRING>`; Define the default landmark type to be used for this region template. When this region template is used by a region, this will be the landmark type exposed to screen reader users, unless this has been overridden at region level. Note: In order for this functionality to work, the Template attribute must include the #REGION_LANDMARK_ATTRIBUTES# substitution string. This should be defined on the main container element of the template. Landmarks provide a powerful way to identify the organization and structure of a web page. The structural information conveyed visually to users should be represented programmatically in the markup using landmark roles. The use of landmarks roles support keyboard navigation to the structure of a web page for screen reader users, and can be used as targets for browser extensions for enhanced keyboard navigation. The W3C ARIA Landmarks site provides useful information, including a good reference implementation (click on the 'Show Landmarks' button to visualise well defined landmarks).; No; —; `<enum:[banner:"Banner", complementary:"Complementary", contentInfo:"Content Info", form:"Form", main:"Main", navigation:"Navigation", region:"Region", search:"Search"]>`; —; —;
- `regionTitleHtmlId` — `<STRING>`; —; No; —; —; maxLength=255; —;

### advanced

- `translatable` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `identifier` — `<STRING>`; —; No; —; —; maxLength=255; —;

### templateOptions

- `preset` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;
- `default` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;

### subscription

- `master` — `<@regionTemplate>`; —; No; —; `<enum:[@/8842.262/universal-theme/alert, @/8842.262/universal-theme/blank-with-attributes, @/8842.262/universal-theme/blank-with-attributes-no-grid, @/8842.262/universal-theme/buttons-container, @/8842.262/universal-theme/cards-container, @/8842.262/universal-theme/carousel-container, @/8842.262/universal-theme/collapsible, @/8842.262/universal-theme/content-block, @/8842.262/universal-theme/hero, @/8842.262/universal-theme/image, @/8842.262/universal-theme/inline-dialog, @/8842.262/universal-theme/inline-drawer, @/8842.262/universal-theme/inline-popup, @/8842.262/universal-theme/interactive-report, @/8842.262/universal-theme/item-container, @/8842.262/universal-theme/login, @/8842.262/universal-theme/search-results-container, @/8842.262/universal-theme/standard, @/8842.262/universal-theme/tabs-container, @/8842.262/universal-theme/title-bar, @/8842.262/universal-theme/wizard-container]>`; —; —;
- `master` — `<@regionTemplate>`; —; No; —; —; lovType=COMPONENT; —;

### region

- `template` — `<STRING>`; —; No; —; —; —; —;
- `htmlTableAttributes` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `image` — `<STRING>`; —; No; —; —; —; —;

### subRegions

- `header` — `<STRING>`; —; No; —; —; —; —;
- `headerEntry` — `<STRING>`; —; No; —; —; —; —;
- `template` — `<STRING>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### css

- `fileUrls` — `<STRING>`; —; No; —; —; maxLength=4000; —;

