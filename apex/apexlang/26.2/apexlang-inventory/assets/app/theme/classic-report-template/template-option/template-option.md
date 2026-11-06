# templateOption

- componentType: `templateOption`
- identifierRequired: true

## Properties

### advanced

- `staticId` — `<STRING>`; Enter a unique Static ID to identify this component in API calls or refer to it in application export files. If you change the Static ID, dependent components will retain their references, but any existing API calls using the old ID must be updated manually.; Yes; —; —; maxLength=255; —;
- `isAdvancedOption` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `identifier` — `<STRING>`; Deprecated. The internal name of this template option.; No; —; —; maxLength=255; —;

### help

- `helpText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### identification (direct group)

- `group` — `<@templateOptionGroup>`; —; No; —; —; lovType=COMPONENT; —;
- `sequence` — `<INTEGER>`; Enter the display sequence for this template option.; Yes; —; —; —; —;
- `name` — `<STRING>`; —; Yes; —; —; maxLength=30; —;

### subscription

- `master` — `<@templateOption>`; —; No; —; `<enum:[@/8842.262/universal-theme/badge-list/128px, @/8842.262/universal-theme/badge-list/2columngrid, @/8842.262/universal-theme/badge-list/32px, @/8842.262/universal-theme/badge-list/3columngrid, @/8842.262/universal-theme/badge-list/48px, @/8842.262/universal-theme/badge-list/4columngrid, @/8842.262/universal-theme/badge-list/5columngrid, @/8842.262/universal-theme/badge-list/64px, @/8842.262/universal-theme/badge-list/96px, @/8842.262/universal-theme/badge-list/apply-theme-colors, @/8842.262/universal-theme/badge-list/circular, @/8842.262/universal-theme/badge-list/fixed, @/8842.262/universal-theme/badge-list/flexiblebox, @/8842.262/universal-theme/badge-list/floatitems, @/8842.262/universal-theme/badge-list/grid, @/8842.262/universal-theme/badge-list/stacked, @/8842.262/universal-theme/cards/2-columns, @/8842.262/universal-theme/cards/2-lines, @/8842.262/universal-theme/cards/3-columns, @/8842.262/universal-theme/cards/3-lines, @/8842.262/universal-theme/cards/4-columns, @/8842.262/universal-theme/cards/4-lines, @/8842.262/universal-theme/cards/5-columns, @/8842.262/universal-theme/cards/basic, @/8842.262/universal-theme/cards/block, @/8842.262/universal-theme/cards/card-raise-card, @/8842.262/universal-theme/cards/cards-color-fill, @/8842.262/universal-theme/cards/compact, @/8842.262/universal-theme/cards/display-icons, @/8842.262/universal-theme/cards/display-initials, @/8842.262/universal-theme/cards/display-subtitle, @/8842.262/universal-theme/cards/featured, @/8842.262/universal-theme/cards/float, @/8842.262/universal-theme/cards/hidden-body-text, @/8842.262/universal-theme/cards/icons-rounded, @/8842.262/universal-theme/cards/icons-square, @/8842.262/universal-theme/cards/span-horizontally, @/8842.262/universal-theme/cards/use-theme-colors, @/8842.262/universal-theme/comments/basic, @/8842.262/universal-theme/comments/icons-rounded, @/8842.262/universal-theme/comments/icons-square, @/8842.262/universal-theme/comments/speech-bubbles, @/8842.262/universal-theme/content-row/actions-hidden, @/8842.262/universal-theme/content-row/alignment-top, @/8842.262/universal-theme/content-row/description-hidden, @/8842.262/universal-theme/content-row/icon-hidden, @/8842.262/universal-theme/content-row/misc-hidden, @/8842.262/universal-theme/content-row/selection-hidden, @/8842.262/universal-theme/content-row/stack-mobile, @/8842.262/universal-theme/content-row/style-compact, @/8842.262/universal-theme/content-row/title-hidden, @/8842.262/universal-theme/contextual-info/display-items-stacked, @/8842.262/universal-theme/contextual-info/display-labels-stacked, @/8842.262/universal-theme/contextual-info/hide-empty-values, @/8842.262/universal-theme/media-list/2-column-grid, @/8842.262/universal-theme/media-list/3-column-grid, @/8842.262/universal-theme/media-list/4-column-grid, @/8842.262/universal-theme/media-list/5-column-grid, @/8842.262/universal-theme/media-list/apply-theme-colors, @/8842.262/universal-theme/media-list/icons-rounded, @/8842.262/universal-theme/media-list/icons-square, @/8842.262/universal-theme/media-list/large, @/8842.262/universal-theme/media-list/show-badges, @/8842.262/universal-theme/media-list/show-description, @/8842.262/universal-theme/media-list/show-icons, @/8842.262/universal-theme/media-list/span-horizontal, @/8842.262/universal-theme/media-list/stack, @/8842.262/universal-theme/standard/altrowcolorsdisable, @/8842.262/universal-theme/standard/altrowcolorsenable, @/8842.262/universal-theme/standard/enable, @/8842.262/universal-theme/standard/horizontalborders, @/8842.262/universal-theme/standard/removeallborders, @/8842.262/universal-theme/standard/removeouterborders, @/8842.262/universal-theme/standard/rowhighlightdisable, @/8842.262/universal-theme/standard/stretchreport, @/8842.262/universal-theme/standard/verticalborders, @/8842.262/universal-theme/timeline/compact, @/8842.262/universal-theme/value-attribute-pairs-column/fixed-large, @/8842.262/universal-theme/value-attribute-pairs-column/fixed-medium, @/8842.262/universal-theme/value-attribute-pairs-column/fixed-small, @/8842.262/universal-theme/value-attribute-pairs-column/hide-empty-values, @/8842.262/universal-theme/value-attribute-pairs-column/left-aligned-details, @/8842.262/universal-theme/value-attribute-pairs-column/right-aligned-details, @/8842.262/universal-theme/value-attribute-pairs-column/variable-large, @/8842.262/universal-theme/value-attribute-pairs-column/variable-medium, @/8842.262/universal-theme/value-attribute-pairs-column/variable-small, @/8842.262/universal-theme/value-attribute-pairs-row/fixed-large, @/8842.262/universal-theme/value-attribute-pairs-row/fixed-medium, @/8842.262/universal-theme/value-attribute-pairs-row/fixed-small, @/8842.262/universal-theme/value-attribute-pairs-row/left-aligned-details, @/8842.262/universal-theme/value-attribute-pairs-row/right-aligned-details, @/8842.262/universal-theme/value-attribute-pairs-row/variable-large, @/8842.262/universal-theme/value-attribute-pairs-row/variable-medium, @/8842.262/universal-theme/value-attribute-pairs-row/variable-small]>`; —; —;
- `master` — `<@templateOption>`; —; No; —; —; lovType=COMPONENT; —;

### appearance

- `cssClasses` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

