# globalTemplateOption

- componentType: `globalTemplateOption`
- identifierRequired: true
- filePath: `shared-components/themes/<name>/global-template-options.apx`

## Properties

### advanced

- `staticId` — `<STRING>`; Enter a unique Static ID to identify this component in API calls or refer to it in application export files. If you change the Static ID, dependent components will retain their references, but any existing API calls using the old ID must be updated manually.; Yes; —; —; maxLength=255; —;
- `isAdvancedOption` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `identifier` — `<STRING>`; Deprecated. The internal name of this template option.; No; —; —; maxLength=255; —;

### help

- `helpText` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### identification (direct group)

- `templateType` — `<STRING>`; —; Yes; —; `<enum:[button:"Button", item:"Item", region:"Region", report:"Report", list:"List", page:"Page", breadcrumb:"Breadcrumb"]>`; —; —;
- `group` — `<@templateOptionGroup>`; —; No; —; —; lovType=COMPONENT; —;
- `sequence` — `<INTEGER>`; Enter the display sequence for this template option.; Yes; —; —; —; —;
- `name` — `<STRING>`; —; Yes; —; —; maxLength=30; —;

### subscription

- `master` — `<@globalTemplateOption>`; —; No; —; `<enum:[@/8842.262/universal-theme/bottom/page, @/8842.262/universal-theme/danger/button, @/8842.262/universal-theme/deferred-page-rendering/page, @/8842.262/universal-theme/display-as-link/button, @/8842.262/universal-theme/display-as-pill-button/item, @/8842.262/universal-theme/display-text-style-bold/item, @/8842.262/universal-theme/display-text-style-normal/item, @/8842.262/universal-theme/fbm-large/item, @/8842.262/universal-theme/fbm-medium/item, @/8842.262/universal-theme/fbm-none/item, @/8842.262/universal-theme/fbm-small/item, @/8842.262/universal-theme/flm-large/item, @/8842.262/universal-theme/flm-medium/item, @/8842.262/universal-theme/flm-none/item, @/8842.262/universal-theme/flm-small/item, @/8842.262/universal-theme/formleftlabels/region, @/8842.262/universal-theme/formremovepadding/region, @/8842.262/universal-theme/formsizelarge/region, @/8842.262/universal-theme/formsizexlarge/region, @/8842.262/universal-theme/formslimpadding/region, @/8842.262/universal-theme/formstandardpadding/region, @/8842.262/universal-theme/frm-large/item, @/8842.262/universal-theme/frm-medium/item, @/8842.262/universal-theme/frm-none/item, @/8842.262/universal-theme/frm-small/item, @/8842.262/universal-theme/ftm-large/item, @/8842.262/universal-theme/ftm-medium/item, @/8842.262/universal-theme/ftm-none/item, @/8842.262/universal-theme/ftm-small/item, @/8842.262/universal-theme/h4/region, @/8842.262/universal-theme/heading-level-h1/region, @/8842.262/universal-theme/heading-level-h2/region, @/8842.262/universal-theme/heading-level-h3/region, @/8842.262/universal-theme/heading-level-h5/region, @/8842.262/universal-theme/heading-level-h6/region, @/8842.262/universal-theme/hide-password-visibility/item, @/8842.262/universal-theme/hide-when-all-rows-displayed/report, @/8842.262/universal-theme/item-remove-padding/item, @/8842.262/universal-theme/item-slim-padding/item, @/8842.262/universal-theme/large-field/item, @/8842.262/universal-theme/large/button, @/8842.262/universal-theme/largebottommargin/button, @/8842.262/universal-theme/largeleftmargin/button, @/8842.262/universal-theme/largerightmargin/button, @/8842.262/universal-theme/largetopmargin/button, @/8842.262/universal-theme/middle/page, @/8842.262/universal-theme/nobottommargin/button, @/8842.262/universal-theme/noleftmargin/button, @/8842.262/universal-theme/norightmargin/button, @/8842.262/universal-theme/notopmargin/button, @/8842.262/universal-theme/noui/button, @/8842.262/universal-theme/pill/button, @/8842.262/universal-theme/pillend/button, @/8842.262/universal-theme/pillstart/button, @/8842.262/universal-theme/post-text-block/item, @/8842.262/universal-theme/pre-text-block/item, @/8842.262/universal-theme/primary/button, @/8842.262/universal-theme/rbm-large/region, @/8842.262/universal-theme/rbm-medium/region, @/8842.262/universal-theme/rbm-none/region, @/8842.262/universal-theme/rbm-small/region, @/8842.262/universal-theme/remove-padding/page, @/8842.262/universal-theme/rlm-large/region, @/8842.262/universal-theme/rlm-medium/region, @/8842.262/universal-theme/rlm-none/region, @/8842.262/universal-theme/rlm-small/region, @/8842.262/universal-theme/rrm-large/region, @/8842.262/universal-theme/rrm-medium/region, @/8842.262/universal-theme/rrm-none/region, @/8842.262/universal-theme/rrm-small/region, @/8842.262/universal-theme/rtm-large/region, @/8842.262/universal-theme/rtm-medium/region, @/8842.262/universal-theme/rtm-none/region, @/8842.262/universal-theme/rtm-small/region, @/8842.262/universal-theme/showformlabelsabove/region, @/8842.262/universal-theme/simple/button, @/8842.262/universal-theme/small/button, @/8842.262/universal-theme/smallbottommargin/button, @/8842.262/universal-theme/smallleftmargin/button, @/8842.262/universal-theme/smallrightmargin/button, @/8842.262/universal-theme/smalltopmargin/button, @/8842.262/universal-theme/sort-center/region, @/8842.262/universal-theme/sort-end/region, @/8842.262/universal-theme/stretch-form-fields/region, @/8842.262/universal-theme/stretch-form-item/item, @/8842.262/universal-theme/stretch/button, @/8842.262/universal-theme/success/button, @/8842.262/universal-theme/tiny/button, @/8842.262/universal-theme/top/page, @/8842.262/universal-theme/warning/button, @/8842.262/universal-theme/x-large-size/item]>`; —; —;
- `master` — `<@globalTemplateOption>`; —; No; —; —; lovType=COMPONENT; —;

### appearance

- `cssClasses` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

