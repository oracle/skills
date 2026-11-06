# Comments Template Options

These entries come from `create_plugin_attribute` and `create_plugin_attr_value`, not from `wwv_flow_template_options`.

Apply these values through the owning component's settings plus the shared avatar owner file when avatar rendering is enabled.
Load `../avatar/avatar._template_options.md` for the shared avatar substructure used by Comments.
Emit only exact accepted values from this inventory. Do not concatenate adjacent values into one token and do not substitute labels or implementation details.
Rows scoped to `REPORT` or `REPORT_GROUP` record Universal Theme export metadata only; they do not by themselves prove an APEXlang emission shape. Emit report rows only where the curated Comments contract and target compiler permit them, and do not emit `REPORT_GROUP` rows because the pinned compiler exposes no supported Comments grouping block.

When a row includes `values=`, pass the left-hand side of each `name=>return_value` pair.

## Comments (`comments`)
Supported: `PARTIAL:REPORT`

- `attributes` | prompt=`Attributes` | type=`HTML` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `commentClass` | prompt=`Comment Class` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `commentText` | prompt=`Comment Text` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`true` | default=`--` | group=`--` | depends=`--`
- `date` | prompt=`Date` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `displayAvatar` | prompt=`Display Avatar` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`Y` | group=`--` | depends=`--`
- `userName` | prompt=`User Name` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`true` | default=`--` | group=`--` | depends=`--`
- `alignment` | prompt=`Alignment` | type=`TEXT` | scope=`REPORT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `applyThemeColors` | prompt=`Apply Theme Colors` | type=`CHECKBOX` | scope=`REPORT` | required=`false` | default=`Y` | group=`--` | depends=`--`
- `style` | prompt=`Style` | type=`SELECT LIST` | scope=`REPORT` | required=`true` | default=`t-Comments--basic` | group=`--` | depends=`--` | values=`basic=>t-Comments--basic, chatSpeechBubbles=>t-Comments--chat`
- `groupIcon` | prompt=`Icon` | type=`ICON` | scope=`REPORT_GROUP` | required=`false` | default=`--` | group=`Grouping` | depends=`groupTitle NOT_NULL`
- `groupTitle` | prompt=`Title` | type=`HTML` | scope=`REPORT_GROUP` | required=`false` | default=`--` | group=`Grouping` | depends=`--`
