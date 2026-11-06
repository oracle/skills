# Actions Template Options

These entries come from `create_plugin_attribute` and `create_plugin_attr_value`, not from `wwv_flow_template_options`.

Apply these values through `settings`.
Example: `settings { gap: medium size: large }`
Emit only exact accepted values from this inventory. Do not concatenate adjacent values into one token and do not substitute labels or implementation details.

When a row includes `values=`, pass the left-hand side of each `name=>return_value` pair.

## Actions (`actions`)
Supported: `PARTIAL`

- `gap` | prompt=`Spacing` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`large=>gapLarge, medium=>gapMedium, none=>gapNone, small=>gapSmall`
- `size` | prompt=`Size` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`extraLarge=>xlarge, large=>large, medium=>medium, small=>small, tiny=>tiny`
- `wrapActions` | prompt=`Wrap Actions` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`N` | group=`--` | depends=`--`
