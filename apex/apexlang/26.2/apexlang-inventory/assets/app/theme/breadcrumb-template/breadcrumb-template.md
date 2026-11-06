# breadcrumbTemplate

- componentType: `breadcrumbTemplate`
- identifierRequired: true
- filePath: `shared-components/themes/<name>/breadcrumb-templates/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The display name of this template.; Yes; —; —; maxLength=255; —;
- `templateClass` — `<STRING>`; —; No; —; `<enum:[breadcrumb:"Breadcrumb", hierarchical:"Hierarchical", custom1:"Custom 1", custom2:"Custom 2", custom3:"Custom 3", custom4:"Custom 4", custom5:"Custom 5", custom6:"Custom 6", custom7:"Custom 7", custom8:"Custom 8"]>`; —; —;

### entry

- `linkAttributes` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `currentPage` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `nonCurrentPage` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### advanced

- `translatable` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `identifier` — `<STRING>`; —; No; —; —; maxLength=255; —;

### templateOptions

- `preset` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;
- `default` — `<STRING>`; —; No; —; —; lovType=TEMPLATE_OPTIONS; —;

### subscription

- `master` — `<@breadcrumbTemplate>`; —; No; —; `<enum:[@/8842.262/universal-theme/breadcrumb]>`; —; —;
- `master` — `<@breadcrumbTemplate>`; —; No; —; —; lovType=COMPONENT; —;

### breadcrumb

- `startWith` — `<STRING>`; —; Yes; `PARENT_TO_LEAF`; `<enum:[childBreadcrumbEntries:"Child Breadcrumb Entries", currentBreadcrumb:"Current Breadcrumb", parentBreadcrumbEntries:"Parent Breadcrumb Entries", parentToLeaf:"Parent to Leaf (breadcrumb style)"]>`; —; —;
- `beforeEntries` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `afterEntries` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `betweenEntries` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `maxEntries` — `<INTEGER>`; —; Yes; `12`; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

