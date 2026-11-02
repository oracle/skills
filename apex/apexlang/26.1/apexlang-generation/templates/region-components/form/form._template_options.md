# Form Region Template Options

Use the listed `static_id` as the exact value to pass in the region's `templateOptions`.
Example: `templateOptions: [stick-to-bottom-for-mobile]`
`#DEFAULT#` remains a standalone entry when used. Do not concatenate it with another token or substitute CSS class strings for the documented accepted value.

## Buttons Container (`buttons-container`)
Preset: none

- Stick to Bottom for Mobile | `static_id=stick-to-bottom-for-mobile` | `css=t-ButtonRegion--stickToBottom` | `group=--`
- No Padding | `static_id=no-padding` | `css=t-ButtonRegion--noPadding` | `group=Body Padding`
- Slim Padding | `static_id=slim-padding` | `css=t-ButtonRegion--slimPadding` | `group=Body Padding`
- Borderless | `static_id=borderless` | `css=t-ButtonRegion--noBorder` | `group=Style`
- Remove UI Decoration | `static_id=remove-ui-decoration` | `css=t-ButtonRegion--noUI` | `group=Style`

## Item Container (`item-container`)
Preset: none

- Stack on Mobile | `static_id=stack-on-mobile` | `css=t-ItemContainer--stackMobile` | `group=--`
- Wrap Items | `static_id=wrap-items` | `css=t-ItemContainer--wrap` | `group=--`
- Center | `static_id=center` | `css=t-ItemContainer--alignCenter` | `group=Alignment`
- End | `static_id=end` | `css=t-ItemContainer--alignEnd` | `group=Alignment`
- Start | `static_id=start` | `css=t-ItemContainer--alignStart` | `group=Alignment`
- Stretch | `static_id=stretch` | `css=t-ItemContainer--alignStretch` | `group=Alignment`
