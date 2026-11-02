# Timeline Template Options

These entries come from `create_plugin_attribute` and `create_plugin_attr_value`, not from `wwv_flow_template_options`.

Apply these values through the owning component's settings plus the shared avatar and badge owner files when those substructures are enabled.
Load `../avatar/avatar._template_options.md` and `../badge/badge._template_options.md` for the shared substructures used by Timeline.
Emit only exact accepted values from this inventory. Do not concatenate adjacent values into one token and do not substitute labels or implementation details.
Rows scoped to `REPORT` or `REPORT_GROUP` record Universal Theme export metadata only; they do not prove an APEXlang emission shape. The current Timeline compiler contract rejects root report attributes and exposes no supported grouping block, so follow the Timeline workflow and do not emit those rows.

When a row includes `values=`, pass the left-hand side of each `name=>return_value` pair.

## Timeline (`timeline`)
Supported: `PARTIAL:REPORT`

- `date` | prompt=`Date` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`true` | default=`--` | group=`--` | depends=`--`
- `description` | prompt=`Description` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `displayAvatar` | prompt=`Display Avatar` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`N` | group=`--` | depends=`--`
- `displayBadge` | prompt=`Display Badge` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`N` | group=`--` | depends=`--`
- `title` | prompt=`Title` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`true` | default=`--` | group=`--` | depends=`--`
- `userName` | prompt=`User Name` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`true` | default=`--` | group=`--` | depends=`--`
- `applyThemeColors` | prompt=`Apply Theme Colors` | type=`CHECKBOX` | scope=`REPORT` | required=`false` | default=`Y` | group=`--` | depends=`--`
- `style` | prompt=`Style` | type=`SELECT LIST` | scope=`REPORT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`compact=>t-Timeline--compact`
- `groupIcon` | prompt=`Icon` | type=`ICON` | scope=`REPORT_GROUP` | required=`false` | default=`--` | group=`Grouping` | depends=`groupTitle NOT_NULL`
- `groupTitle` | prompt=`Title` | type=`HTML` | scope=`REPORT_GROUP` | required=`false` | default=`--` | group=`Grouping` | depends=`--`
