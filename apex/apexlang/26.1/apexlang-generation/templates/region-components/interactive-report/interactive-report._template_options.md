# Interactive Report Template Options

Use the listed `static_id` as the exact value to pass in the region's `templateOptions`.
Example: `templateOptions: [show-maximize-button]`
`#DEFAULT#` remains a standalone entry when used. Composite values such as `t-IRR-region--hideHeader js-addHiddenHeadingRoleDesc` stay atomic only when that full combined value is the accepted emitted value.

## Interactive Report (`interactive-report`)
Preset: `t-IRR-region--hideHeader js-addHiddenHeadingRoleDesc`

- Remove Borders | `static_id=remove-borders` | `css=t-IRR-region--noBorders` | `group=--`
- Show Maximize Button | `static_id=show-maximize-button` | `css=js-showMaximizeButton` | `group=--`
- Hidden | `static_id=hidden` | `css=t-IRR-region--removeHeader js-removeLandmark` | `group=Header`
- Hidden but accessible | `static_id=hidden-but-accessible` | `css=t-IRR-region--hideHeader js-addHiddenHeadingRoleDesc` | `group=Header`
