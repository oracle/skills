# Content Row Template Options

These entries come from `create_plugin_attribute` and `create_plugin_attr_value`, not from `wwv_flow_template_options`.

Apply these values through `settings`, `plugin-appearance`, and `plugin-grouping`.
Load `../avatar/avatar._template_options.md` and `../badge/badge._template_options.md` for the shared avatar and badge substructures used by Content Row.
Emit only exact accepted values from this inventory. Do not concatenate adjacent values into one token and do not substitute labels or implementation details.

When a row includes `values=`, pass the left-hand side of each `name=>return_value` pair.

## Content Row (`contentRow`)
Supported: `PARTIAL:REPORT`

- `description` | prompt=`Description` | type=`HTML` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `displayAvatar` | prompt=`Display Avatar` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`N` | group=`--` | depends=`--`
- `displayBadge` | prompt=`Display Badge` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`N` | group=`--` | depends=`--`
- `itemCssClasses` | prompt=`Item CSS Classes` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `miscellaneous` | prompt=`Miscellaneous` | type=`HTML` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `overline` | prompt=`Overline` | type=`HTML` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `title` | prompt=`Title` | type=`HTML` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `applyThemeColors` | prompt=`Apply Theme Colors` | type=`CHECKBOX` | scope=`REPORT` | required=`false` | default=`Y` | group=`Appearance` | depends=`--`
- `hideBorders` | prompt=`Hide Borders` | type=`CHECKBOX` | scope=`REPORT` | required=`false` | default=`N` | group=`Appearance` | depends=`--`
- `removePadding` | prompt=`Remove Padding` | type=`CHECKBOX` | scope=`REPORT` | required=`false` | default=`N` | group=`Appearance` | depends=`--`
- `stackOnMobile` | prompt=`Stack on Mobile` | type=`CHECKBOX` | scope=`REPORT` | required=`false` | default=`N` | group=`Appearance` | depends=`--`
- `style` | prompt=`Style` | type=`SELECT LIST` | scope=`REPORT` | required=`false` | default=`--` | group=`Appearance` | depends=`--` | values=`compact=>t-ContentRow--styleCompact`
- `icon` | prompt=`Icon` | type=`ICON` | scope=`REPORT_GROUP` | required=`false` | default=`--` | group=`Grouping` | depends=`title NOT_NULL`
- `title` | prompt=`Title` | type=`HTML` | scope=`REPORT_GROUP` | required=`true` | default=`--` | group=`Grouping` | depends=`--`
