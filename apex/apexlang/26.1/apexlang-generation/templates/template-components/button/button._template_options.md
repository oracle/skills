# Button Template Component Options

These entries come from `create_plugin_attribute` and `create_plugin_attr_value`, not from `wwv_flow_template_options`.

Apply these values directly through the helper attributes.
Emit only exact accepted values from this inventory. Do not concatenate adjacent values into one token and do not substitute labels or implementation details.

## Button (`button`)
Supported: `child-helper`

- `cssClasses` | prompt=`CSS Classes` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `iconClasses` | prompt=`Icon Classes` | type=`ICON` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `isDisabled` | prompt=`Is Disabled` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`N` | group=`--` | depends=`--`
- `isHot` | prompt=`Is Hot` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`N` | group=`--` | depends=`--`
- `isIconOnly` | prompt=`Is Icon Only` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`N` | group=`--` | depends=`--`
- `label` | prompt=`Label` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `linkAttribute` | prompt=`Link Attribute` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `linkUrl` | prompt=`Link URL` | type=`LINK` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `menuId` | prompt=`Menu ID` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`

## Icon Placement

- For icon-plus-text helpers, put exactly one emitted Universal Theme icon-position class in `cssClasses`.
- Default: `t-Button--iconLeft`.
- Explicit right-side override: `t-Button--iconRight`.
- Do not add either class when `isIconOnly: true`.
