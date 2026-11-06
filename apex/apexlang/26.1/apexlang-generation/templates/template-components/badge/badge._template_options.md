# Badge Template Component Options

These entries come from `create_plugin_attribute` and `create_plugin_attr_value`, not from `wwv_flow_template_options`.

Apply these values through the owning component's badge settings block.
Emit only exact accepted values from this inventory. Do not concatenate adjacent values into one token and do not substitute labels or implementation details.

When a row includes `values=`, pass the left-hand side of each `name=>return_value` pair.

## Badge (`badge`)
Supported: `PARTIAL:REPORT`

- `displayLabel` | prompt=`Display Label` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`N` | group=`--` | depends=`--`
- `icon` | prompt=`Icon` | type=`ICON` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `label` | prompt=`Label` | type=`TEXT` | scope=`COMPONENT` | required=`true` | default=`--` | group=`--` | depends=`--`
- `shape` | prompt=`Shape` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`circular=>t-Badge--circle, rounded=>t-Badge--rounded, square=>t-Badge--square`
- `size` | prompt=`Size` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`large=>t-Badge--lg, medium=>t-Badge--md, small=>t-Badge--sm`
- `state` | prompt=`State` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `style` | prompt=`Style` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`outline=>t-Badge--outline, subtle=>t-Badge--subtle`
- `value` | prompt=`Value` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`true` | default=`--` | group=`--` | depends=`--`
