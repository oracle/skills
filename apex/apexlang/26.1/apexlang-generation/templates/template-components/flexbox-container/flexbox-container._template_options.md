# Flexbox Container Template Options

These entries come from `create_plugin_attribute` and `create_plugin_attr_value`, not from `wwv_flow_template_options`.

Apply these values through the owning component's settings block.
Emit only exact accepted values from this inventory. Do not concatenate adjacent values into one token and do not substitute labels or implementation details.

When a row includes `values=`, pass the left-hand side of each `name=>return_value` pair.

## Flexbox Container (`flexboxContainer`)
Supported: `REGION_ONLY`

- `alignContent` | prompt=`Align-Content` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`around=>u-align-content-around, between=>u-align-content-between, center=>u-align-content-center, end=>u-align-content-end, evenly=>u-align-content-evenly, start=>u-align-content-start`
- `alignItems` | prompt=`Align-Items` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`baseline=>u-align-items-baseline, center=>u-align-items-center, end=>u-align-items-end, start=>u-align-items-start, stretch=>u-align-items-stretch`
- `direction` | prompt=`Direction` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`column=>u-flex-direction-column, columnReverse=>u-flex-direction-column-reverse, row=>u-flex-direction-row, rowReverse=>u-flex-direction-row-reverse`
- `flexBehavior` | prompt=`Flex Item Sizing` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`doNotGrow=>a-FlexContainer--noGrow, fillAvailableSpace=>a-FlexContainer--fill, growIfNeeded=>a-FlexContainer--grow`
- `gap` | prompt=`Gap` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`lg=>u-gap-4, md=>u-gap-2, none=>u-gap-0, sm=>u-gap-1, xl=>u-gap-6, xs=>u-gap-0_5, xxl=>u-gap-8, xxs=>u-gap-px`
- `justifyContent` | prompt=`Justify-Content` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`around=>u-justify-content-space-around, between=>u-justify-content-space-between, center=>u-justify-content-center, end=>u-justify-content-flex-end, start=>u-justify-content-flex-start, stretch=>u-justify-content-stretch`
- `overflow` | prompt=`Overflow` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`auto=>u-overflow-auto, clip=>u-overflow-clip, hidden=>u-overflow-hidden, scrollHorizontally=>u-overflow-x-scroll, scrollVertically=>u-overflow-y-scroll, visible=>u-overflow-visible`
- `wrap` | prompt=`Wrap` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`noWrap=>u-flex-wrap-nowrap, wrap=>u-flex-wrap`
