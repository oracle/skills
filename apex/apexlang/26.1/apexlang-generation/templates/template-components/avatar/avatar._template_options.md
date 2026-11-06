# Avatar Template Component Options

These entries come from `create_plugin_attribute` and `create_plugin_attr_value`, not from `wwv_flow_template_options`.

For a standalone `themeTemplateComponent/avatar` region, apply these values through `settings {}`. For an owning component that embeds Avatar behavior, apply them through that component's documented avatar block such as `plugin-avatar {}`.
Emit only exact accepted values from this inventory. Do not concatenate adjacent values into one token and do not substitute labels or implementation details.

When a row includes `values=`, pass the left-hand side of each `name=>return_value` pair.

## Avatar (`avatar`)
Supported: `PARTIAL:REPORT`

- `cssClasses` | prompt=`CSS Classes` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `description` | prompt=`Description` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `icon` | prompt=`Icon` | type=`ICON` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`type EQUALS ICON`
- `image` | prompt=`Image` | type=`MEDIA` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`type EQUALS IMAGE`
- `initials` | prompt=`Initials` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`type EQUALS INITIALS`
- `shape` | prompt=`Shape` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`circular=>t-Avatar--circle, noShape=>t-Avatar--noShape, rounded=>t-Avatar--rounded, square=>t-Avatar--square`
- `size` | prompt=`Size` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`extraExtraLarge=>t-Avatar--xxl, extraExtraSmall=>t-Avatar--xxs, extraLarge=>t-Avatar--xl, extraSmall=>t-Avatar--xs, large=>t-Avatar--lg, medium=>t-Avatar--md, small=>t-Avatar--sm`
- `type` | prompt=`Type` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`IMAGE` | group=`--` | depends=`--` | values=`icon=>ICON, image=>IMAGE, initials=>INITIALS`
- `spacing` | prompt=`Spacing` | type=`SELECT LIST` | scope=`REPORT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`auto=>t-Avatars--spacingAuto, large=>t-Avatars--spacingLg, medium=>t-Avatars--spacingMd, none=>t-Avatars--spacingNone, small=>t-Avatars--spacingSm, stack=>t-Avatars--spacingStack`
- `groupIcon` | prompt=`Icon` | type=`ICON` | scope=`REPORT_GROUP` | required=`false` | default=`--` | group=`Grouping` | depends=`groupTitle NOT_NULL`
- `groupTitle` | prompt=`Title` | type=`HTML` | scope=`REPORT_GROUP` | required=`false` | default=`--` | group=`Grouping` | depends=`--`
