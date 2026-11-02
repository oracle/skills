# Metric Card Template Options

These entries come from `create_plugin_attribute` and `create_plugin_attr_value`, not from `wwv_flow_template_options`.

Apply these values through `settings`, `plugin-avatar`, `plugin-badge`, and `plugin-grouping`.
Emit only exact accepted values from this inventory. Do not concatenate adjacent values into one token and do not substitute labels or implementation details.

`layout`, `itemCssClasses`, `plugin-grouping`, `rowSelection`, `messages`, and `pagination` are report-only. Omit them when `componentAppearance.display: partial`.

For source-backed selector fields, use bare delivered aliases: `plugin-avatar.initials`, `plugin-badge.value`, and `plugin-badge.state` must not use `&COLUMN.` substitutions. A source-backed badge label also uses its bare delivered alias.

When a row includes `values=`, pass the left-hand side of each `name=>return_value` pair.

## Metric Card (`metricCard`)
Supported: `PARTIAL:REPORT`

- `meta` | prompt=`Meta` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `metaCssClasses` | prompt=`Meta CSS Classes` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `metric` | prompt=`Metric` | type=`TEXT` | scope=`COMPONENT` | required=`true` | default=`--` | group=`--` | depends=`--`
- `metricCssClasses` | prompt=`Metric CSS Classes` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `title` | prompt=`Title` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `titleCssClasses` | prompt=`Title CSS Classes` | type=`TEXT` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `layout` | prompt=`Layout` | type=`SELECT LIST` | scope=`REPORT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`2Columns=>2cols, 3Columns=>3cols, 4Columns=>4cols, 5Columns=>5cols, autoWrapping=>auto, overflow=>overflow, stacked=>stacked`
- `itemCssClasses` | prompt=`Item CSS Classes` | type=`TEXT` | scope=`REPORT` | required=`false` | default=`--` | group=`Advanced` | depends=`--`
- `groupIcon` | prompt=`Group Icon` | type=`ICON` | scope=`REPORT_GROUP` | required=`false` | default=`--` | group=`Grouping` | depends=`groupTitle NOT_NULL`
- `groupTitle` | prompt=`Group Title` | type=`TEXT` | scope=`REPORT_GROUP` | required=`false` | default=`--` | group=`Grouping` | depends=`--`

## Metric Card Avatar (`plugin-avatar`)

- `displayAvatar` | prompt=`Display Avatar` | type=`YES NO` | scope=`COMPONENT` | required=`false` | default=`--` | group=`Avatar` | depends=`--`
- `type` | prompt=`Type` | type=`SELECT LIST` | scope=`COMPONENT` | required=`true` | default=`icon` | group=`Avatar` | depends=`displayAvatar EQUALS true` | values=`icon=>icon, image=>image, initials=>initials`
- `icon` | prompt=`Icon` | type=`ICON` | scope=`COMPONENT` | required=`true` | default=`fa-line-chart` | group=`Avatar` | depends=`type EQUALS icon`
- `image` | prompt=`Image` | type=`MEDIA` | scope=`COMPONENT` | required=`true` | default=`--` | group=`Avatar` | depends=`type EQUALS image`
- `initials` | prompt=`Initials` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`true` | default=`--` | group=`Avatar` | depends=`type EQUALS initials`
- `position` | prompt=`Position` | type=`SELECT LIST` | scope=`COMPONENT` | required=`true` | default=`top` | group=`Avatar` | depends=`displayAvatar EQUALS true` | values=`inline=>t-MetricCard-body--avatarPositionInline, top=>t-MetricCard-body--avatarPositionTop`
- `alignment` | prompt=`Alignment` | type=`SELECT LIST` | scope=`COMPONENT` | required=`true` | default=`start` | group=`Avatar` | depends=`position EQUALS inline` | values=`center=>t-MetricCard-body--avatarAlignmentCenter, end=>t-MetricCard-body--avatarAlignmentEnd, start=>t-MetricCard-body--avatarAlignmentStart`
- `shape` | prompt=`Shape` | type=`SELECT LIST` | scope=`COMPONENT` | required=`true` | default=`rounded` | group=`Avatar` | depends=`displayAvatar EQUALS true` | values=`circular=>t-Avatar--circle, noShape=>t-Avatar--noShape, rounded=>t-Avatar--rounded, square=>t-Avatar--square`
- `size` | prompt=`Size` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`Avatar` | depends=`displayAvatar EQUALS true` | values=`large=>t-Avatar--lg, medium=>t-Avatar--md, small=>t-Avatar--sm`
- `style` | prompt=`Style` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`Avatar` | depends=`type IN_LIST initials,icon` | values=`subtle=>t-MetricCard-avatar--subtle`

## Metric Card Badge (`plugin-badge`)

- `displayBadge` | prompt=`Display Badge` | type=`YES NO` | scope=`COMPONENT` | required=`false` | default=`--` | group=`Badge` | depends=`--`
- `label` | prompt=`Label` | type=`TEXT` | scope=`COMPONENT` | required=`true` | default=`--` | group=`Badge` | depends=`displayBadge EQUALS true`
- `value` | prompt=`Value` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`true` | default=`--` | group=`Badge` | depends=`displayBadge EQUALS true`
- `state` | prompt=`State` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`false` | default=`--` | group=`Badge` | depends=`displayBadge EQUALS true`
- `icon` | prompt=`Icon` | type=`ICON` | scope=`COMPONENT` | required=`false` | default=`--` | group=`Badge` | depends=`displayBadge EQUALS true`
- `displayLabel` | prompt=`Display Label` | type=`YES NO` | scope=`COMPONENT` | required=`false` | default=`--` | group=`Badge` | depends=`displayBadge EQUALS true`
- `style` | prompt=`Style` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`Badge` | depends=`displayBadge EQUALS true` | values=`outline=>t-Badge--outline, subtle=>t-Badge--subtle`
- `shape` | prompt=`Shape` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`Badge` | depends=`displayBadge EQUALS true` | values=`circular=>t-Badge--circle, rounded=>t-Badge--rounded, square=>t-Badge--square`
- `size` | prompt=`Size` | type=`SELECT LIST` | scope=`COMPONENT` | required=`false` | default=`--` | group=`Badge` | depends=`displayBadge EQUALS true` | values=`large=>t-Badge--lg, medium=>t-Badge--md, small=>t-Badge--sm`

## Metric Card Actions

- Supported action position: `link`
- Action templates: none
- Do not emit `action.template` or `action.label` for the row link.
- Supported behavior variants are `redirectThisApp`/`redirectOtherApp` with `target`, `redirectUrl` with a reviewed safe `targetUrl`, and `triggerAction` with neither target property. In `targetUrl`, substitutions are limited to query parameters so the scheme, host, path, and fragment remain static. Optional `linkAttributes` must be static and free of inline handlers, URL-bearing attributes, scriptable CSS, and unsafe URL schemes.

## APEX 26.1 Report-only Standard Blocks

These properties are live-compiler-backed standard report properties rather than `create_plugin_attribute` entries:

- `messages.whenNoDataFound`
- `messages.noDataFoundIcon`
- `pagination.entitiesPerPage`

Do not emit pagination `type` or `showTotalCount`; APEX 26.1 rejects them for Metric Card. All three properties above must be omitted in partial mode.
