# Cards Template Options

Use the listed `static_id` as the exact value to pass in the region's `templateOptions`.
Example: `templateOptions: [style-a]`
`#DEFAULT#` remains a standalone entry when used. Composite preset strings stay atomic only when the full combined value is the accepted emitted value.

## Cards Container (`cards-container`)
Preset: `t-CardsRegion--hideHeader js-addHiddenHeadingRoleDesc`

- Apply Theme Colors | `static_id=apply-theme-colors` | `css=u-colors` | `group=--`
- Hidden | `static_id=hidden` | `css=t-CardsRegion--removeHeader js-removeLandmark` | `group=Header`
- Hidden but accessible | `static_id=hidden-but-accessible` | `css=t-CardsRegion--hideHeader js-addHiddenHeadingRoleDesc` | `group=Header`
- Style A | `static_id=style-a` | `css=t-CardsRegion--styleA` | `group=Style`
- Style B | `static_id=style-b` | `css=t-CardsRegion--styleB` | `group=Style`
- Style C | `static_id=style-c` | `css=t-CardsRegion--styleC` | `group=Style`
