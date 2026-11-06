# Media List Template Options

These entries come from `create_plugin_attribute` and `create_plugin_attr_value`, not from `wwv_flow_template_options`.

Apply component- and report-scope values through `settings`, Avatar values through `plugin-avatar`, and Badge values through `plugin-badge`. Treat this file as theme inventory only; emit a property only after it is represented in the selected curated Media List component policy.
Load `../avatar/avatar._template_options.md` and `../badge/badge._template_options.md` for the shared substructures used by Media List.
Emit only exact accepted values from this inventory. Do not concatenate adjacent values into one token and do not substitute labels or implementation details.

`title`, `description`, `displayAvatar`, and `displayBadge` are valid in partial and report mode when accepted by the curated policy. `applyThemeColors`, `layout`, and `size` are report-only. Omit `applyThemeColors` to inherit its `true` default. Use the native default/no-layout flow for narrow containers; select a multi-column or horizontal layout only when the owning container width supports it. Emit nested Avatar/Badge `size` only if the curated Media List plugin block exposes it.

Every nested Avatar/Badge icon must resolve to the build-pinned Font APEX index. In report mode, Media List `title`, `description`, Avatar initials/URL-column image, and Badge value/state use bare projected aliases. In partial mode, page-item-shaped selectors must name declared session-state items, and Badge state must be a proven allowlisted static value.

When a row includes `values=`, pass the left-hand side of each `name=>return_value` pair.

## Media List (`mediaList`)
Supported: `PARTIAL:REPORT`

- `description` | prompt=`Description` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`false` | default=`--` | group=`--` | depends=`--`
- `displayAvatar` | prompt=`Display Avatar` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`N` | group=`--` | depends=`--`
- `displayBadge` | prompt=`Display Badge` | type=`CHECKBOX` | scope=`COMPONENT` | required=`false` | default=`N` | group=`--` | depends=`--`
- `title` | prompt=`Title` | type=`SESSION STATE VALUE` | scope=`COMPONENT` | required=`true` | default=`--` | group=`--` | depends=`--`
- `applyThemeColors` | prompt=`Apply Theme Colors` | type=`CHECKBOX` | scope=`REPORT` | required=`false` | default=`Y` | group=`--` | depends=`--`
- `layout` | prompt=`Layout` | type=`SELECT LIST` | scope=`REPORT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`2ColumnGrid=>t-MediaList--cols t-MediaList--2cols, 3ColumnGrid=>t-MediaList--cols t-MediaList--3cols, 4ColumnGrid=>t-MediaList--cols t-MediaList--4cols, 5ColumnGrid=>t-MediaList--cols t-MediaList--5cols, horizontalSpan=>t-MediaList--horizontal`
- `size` | prompt=`Size` | type=`SELECT LIST` | scope=`REPORT` | required=`false` | default=`--` | group=`--` | depends=`--` | values=`large=>t-MediaList--large force-fa-lg`
- `groupIcon` | prompt=`Icon` | type=`ICON` | scope=`REPORT_GROUP` | required=`false` | default=`--` | group=`Grouping` | depends=`groupTitle NOT_NULL`
- `groupTitle` | prompt=`Title` | type=`HTML` | scope=`REPORT_GROUP` | required=`false` | default=`--` | group=`Grouping` | depends=`--`

The two `REPORT_GROUP` rows above preserve the complete theme inventory. They become a generation surface only when the curated component policy exposes a compatible report-group block and exact property names.
