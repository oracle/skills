---
templateId: region.metric-card.common
componentType: region
version: 1.0
description: Shared contract for metric-card regions.
---

# Purpose

Document the native metric-card region emitted as `themeTemplateComponent/metricCard`.

# Generation Rules (MANDATORY)

1. Use the dedicated `region-metric-card` template.
2. Always emit a region `appearance {}` block for Metric Card.
3. Use a valid region template such as `@/blank-with-attributes` or `@/standard`.
4. For dashboard KPI strips, default `appearance.template` to `@/blank-with-attributes` so the Metric Card renders without visible standard region chrome.
5. Use `@/standard` for Metric Card only when the requested design explicitly needs a titled or landmarked visible region wrapper.
6. Emit `advanced { htmlDomId: ... }` only when external client code, dynamic actions, or other page logic must target a known region DOM id.
7. Set `componentAppearance.display` to `report` for multi-row report output or `partial` for one component without the report wrapper.
8. Use the compiler-resolved `column-f` production for source-column mappings.
9. Keep all Metric Card settings and nested avatar/badge/grouping values aligned with `metric-card._template_options.md`; the standalone Avatar and Badge inventories do not define Metric Card's nested groups.
10. In report mode, treat child `column (...)` metadata as part of the emitted Metric Card source contract, not as an optional compiler appeasement detail. In partial mode, omit report-only settings and blocks.
11. Emit explicit child `column (...)` metadata for every delivered source projection before finals. Do not satisfy the compiler by adding only one placeholder column when the source projects multiple columns.
12. A single Metric Card region can render multiple cards. When the prompt asks for several independent metrics in one region, prefer a multi-row SQL source that normalizes the projections for each card, commonly by `UNION ALL`-ing one row per metric into a shared column shape.
13. Metric Card `settings`, `plugin-avatar`, `plugin-badge`, and `rowSelection` expose more value hooks than just `title` and `metric`. Use the accepted property surface from `metric-card._template_options.md` when those behaviors are needed.
14. Do not require settings property names to match child-column names one-for-one. Rendered `settings.title`, `settings.metric`, and `settings.meta` may bind to literals or `&COLUMN_NAME.` substitutions. Source-selector attributes use bare delivered aliases: `plugin-avatar.initials`, `plugin-badge.value`, `plugin-badge.state`, and a source-backed `plugin-badge.label` must not use `&COLUMN_NAME.`.
15. Metric Card avatar support is export-backed in this runtime through `plugin-avatar {}`. Use `plugin-avatar.displayAvatar` for visibility, emit exactly one payload matching `plugin-avatar.type`, and keep Metric Card-specific position/alignment/style/shape/size configuration in that block.
16. Metric Card badge support is export-backed in this runtime through `plugin-badge {}`. Use `plugin-badge.displayBadge` for visibility and require both `plugin-badge.label` and `plugin-badge.value` when the block is emitted.
17. When `rowSelection` is emitted with any non-null mode, at least one child `column (...)` must mark the row identity with `source.primaryKey: true`.
18. For every emitted child column, set `source.dataType` to one exact token from the Metric Card Column Data Types inventory below.
19. Always emit `settings.metric`; it is required by the APEX 26.1 Metric Card contract.
20. Query-column-backed `settings.title`, `settings.metric`, and `settings.meta` values use `&COLUMN_NAME.` substitution syntax. Literal text remains valid.
21. Metric Card exposes only `action.position: link`. Emit no action template because the component has no action templates.
22. Use declarative action targets. Do not emit arbitrary JavaScript URLs, inline handlers, or unreviewed external URLs.
23. Rely on authenticated page security by default. Add a region or action authorization only when requirements identify a stricter existing scheme; never invent an authorization alias.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Region identifier. |
| name | yes | string | Display name. |
| type | yes | enum | Always `themeTemplateComponent/metricCard`. |
| appearance.template | yes | alias | Region template alias such as `@/standard` or `@/blank-with-attributes`. |
| appearance.templateOptions | optional | array/string | Template modifiers. Default to `#DEFAULT#` unless the chosen region template documents another accepted value. |
| componentAppearance.display | yes | enum | `partial` or `report`. Use `partial` for one component and `report` for multiple report rows. |
| advanced.htmlDomId | optional | string | Use only when external page logic must target a known rendered DOM id for the metric-card region. |
| settings.title | optional | string | Title binding or static text. |
| settings.titleCssClasses | optional | string | Optional title CSS classes. May be literal or substitution-backed. |
| settings.metric | yes | string | Required metric binding or static text. Query-column mappings use `&COLUMN_NAME.`. |
| settings.metricCssClasses | optional | string | Optional metric CSS classes. May be literal or substitution-backed. |
| settings.meta | optional | string | Optional meta text/value binding. |
| settings.metaCssClasses | optional | string | Optional meta CSS classes. May be literal or substitution-backed. |
| settings.layout | report-only | enum | Layout token from `metric-card._template_options.md`, for example `2Columns`, `3Columns`, `stacked`, or `overflow`. Omit in partial mode. |
| settings.itemCssClasses | report-only | string | Optional per-card/item CSS classes. Omit in partial mode. |
| source.sqlQuery | conditional | string | When one Metric Card region must render several cards, prefer a multi-row query with one normalized row per card. `UNION ALL` across per-metric SELECTs is the default pattern when the metrics originate from separate aggregates. |
| orderBy.type | conditional | enum | Grouped output uses `staticValue`. |
| orderBy.orderByClause | conditional | string | Required for grouped output and starts with every grouped child column in grouping order. |
| plugin-avatar.displayAvatar | optional | boolean | Enables avatar rendering for the metric card. Emit inside `plugin-avatar`, not inside `settings`. |
| plugin-avatar.type | conditional | enum | Avatar type when avatar rendering is enabled. Supported values include `image`, `initials`, and `icon`. |
| plugin-avatar.icon | conditional | string | Static build-pinned Font APEX icon or `&COLUMN.` substitution backed by a proven `varchar2` literal/CASE allowlist when `type` is `icon`. |
| plugin-avatar.initials | conditional | source-column identifier | Required when `type` is `initials`. Use a bare delivered `varchar2` alias, not `&COLUMN.` substitution syntax. |
| plugin-avatar.image.type | conditional | enum | Image source type when `plugin-avatar.type` is `image`. Supported values include `blobColumn`, `url`, and `urlColumn` when the owning source delivers the needed image payload. |
| plugin-avatar.image.blobColumn | conditional | string | Image blob column when `plugin-avatar.image.type` is `blobColumn`. |
| plugin-avatar.image.filenameColumn | conditional | string | Filename companion column when a blob-column avatar image is used. |
| plugin-avatar.image.mimeTypeColumn | conditional | string | MIME-type companion column when a blob-column avatar image is used. |
| plugin-avatar.image.lastUpdatedColumn | conditional | string | Last-updated companion column when a blob-column avatar image is used. |
| plugin-avatar.image.url | conditional | string | Static application-managed image path using `#APP_FILES#` or `#APEX_FILES#` when image type is `url`. |
| plugin-avatar.image.urlColumn | conditional | string | Projected `varchar2` URL column built in SQL from `:APP_FILES` or `:APEX_FILES` plus one static relative path. |
| plugin-avatar.position | conditional | enum | Avatar position: `inline` or `top`. |
| plugin-avatar.alignment | conditional | enum | Inline avatar alignment: `start`, `center`, or `end`; omit for `position: top`. |
| plugin-avatar.shape | optional | enum | Metric Card avatar shape: `circular`, `noShape`, `rounded`, or `square`. |
| plugin-avatar.size | optional | enum | Metric Card avatar size: `small`, `medium`, or `large`. |
| plugin-avatar.style | optional | enum | `subtle`, only when avatar type is `icon` or `initials`; omit for `image`. |
| plugin-badge.displayBadge | optional | boolean | Enables badge rendering for the metric card. Emit inside `plugin-badge`, not inside `settings`. |
| plugin-badge.label | conditional | string/source-column identifier | Required when badge rendering is enabled. Use a bare alias when source-backed. |
| plugin-badge.value | conditional | source-column identifier | Required when badge rendering is enabled. Use a bare delivered alias. |
| plugin-badge.state | optional | source-column identifier | Optional `varchar2` alias whose values are restricted to `danger`, `warning`, `success`, or `info`. |
| plugin-badge.icon | optional | string | Static build-pinned Font APEX icon when the design calls for one. |
| plugin-badge.style | optional | enum | Metric Card Badge style token from `metric-card._template_options.md`, for example `subtle` or `outline`. |
| plugin-badge.shape | optional | enum | Metric Card Badge shape token from `metric-card._template_options.md`, for example `circular`, `rounded`, or `square`. |
| plugin-badge.size | optional | enum | Metric Card Badge size token from `metric-card._template_options.md`, for example `small`, `medium`, or `large`. |
| plugin-badge.displayLabel | optional | boolean | Optional label visibility toggle when the design needs it. |
| plugin-grouping.groupTitle | optional | string | Group title for grouped report output. |
| plugin-grouping.groupIcon | optional | string | Static build-pinned Font APEX icon; emit only when a group title is present. |
| rowSelection.type | optional | enum | Optional row-selection mode when the Metric Card region participates in row-selection behavior. Use `focusOnly`, `singleSelection`, or `multipleSelection`. |
| rowSelection.currentSelectionPageItem | conditional | string | Current-selection page item for row-selection modes that persist selection state. Omit it for `focusOnly`. |
| rowSelection.selectAllPageItem | conditional | string | Select-all page item for `multipleSelection`. Omit it for `focusOnly` and `singleSelection`. |
| messages.whenNoDataFound | report-only | string | Optional no-data message. Omit in partial mode. |
| messages.noDataFoundIcon | report-only | icon | Optional static Font APEX no-data icon. Omit in partial mode. |
| pagination.entitiesPerPage | report-only | number | Optional report page size. This is the only supported Metric Card pagination property. |
| column.name | conditional | string | Required for each explicit child column emitted in report mode. |
| column.layout.sequence | conditional | number | Required for each emitted child column. |
| column.source.databaseColumn | required | identifier | Required for each emitted child column. |
| column.source.dataType | required | enum | Use one exact Metric Card value. |
| column.source.primaryKey | optional | boolean | Emit `true` only for a row-identity column when row identity is needed. |
| columns | conditional | list | Required in report mode. Generate one explicit child `column (...)` block for every delivered source projection. |
| action.position | conditional | enum | Metric Card row link position. The only supported value is `link`. |
| action.layout.sequence | conditional | number | Required deterministic action sequence. |
| action.behavior.type | conditional | enum | Row-link behavior: `redirectThisApp`, `redirectOtherApp`, `redirectUrl`, or `triggerAction`. |
| action.behavior.target | conditional | object | Required for declarative application-page targets. |
| action.behavior.targetUrl | conditional | string | Required for `redirectUrl`; use a reviewed relative URL or an `http`, `https`, `mailto`, or `tel` URL without an unsafe scheme. Keep any substitutions inside query parameters so the scheme, host, path, and fragment remain static. |
| action.behavior.linkAttributes | optional | string | Static link attributes without inline event handlers, URL-bearing attributes, scriptable CSS, or unsafe dynamic substitutions. |
| security.authorizationScheme | optional | alias | Existing stricter region authorization. Omit when page authentication is sufficient. |

# Metric Card Column Data Types

Supported `column.source.dataType` values for Metric Card child columns:

- `bfile`
- `blob`
- `boolean`
- `clob`
- `date`
- `intervalDayToSecond`
- `intervalYearToMonth`
- `number`
- `rowid`
- `sdoGeometry`
- `timestamp`
- `timestampWithLocalTimeZone`
- `timestampWithTimeZone`
- `varchar2`

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: themeTemplateComponent/metricCard
  appearance {
    template: {{appearance.template}}
    templateOptions: {{appearance.templateOptions}}
  }
  componentAppearance {
    display: {{componentAppearance.display}}
  }
  orderBy {
    type: {{orderBy.type}}
    orderByClause: {{orderBy.orderByClause}}
  }
  advanced {
    htmlDomId: {{advanced.htmlDomId}}
  }
  settings {
    title: {{settings.title}}
    titleCssClasses: {{settings.titleCssClasses}}
    metric: {{settings.metric}}
    metricCssClasses: {{settings.metricCssClasses}}
    meta: {{settings.meta}}
    metaCssClasses: {{settings.metaCssClasses}}
    layout: {{settings.layout}}
    itemCssClasses: {{settings.itemCssClasses}}
  }
  plugin-avatar {
    displayAvatar: {{pluginAvatar.displayAvatar}}
    type: {{pluginAvatar.type}}
    icon: {{pluginAvatar.icon}}
    initials: {{pluginAvatar.initials}}
    image: {{pluginAvatar.image}}
    position: {{pluginAvatar.position}}
    alignment: {{pluginAvatar.alignment}}
    shape: {{pluginAvatar.shape}}
    size: {{pluginAvatar.size}}
    style: {{pluginAvatar.style}}
  }
  plugin-grouping {
    groupTitle: {{pluginGrouping.groupTitle}}
    groupIcon: {{pluginGrouping.groupIcon}}
  }
  plugin-badge {
    displayBadge: {{pluginBadge.displayBadge}}
    label: {{pluginBadge.label}}
    value: {{pluginBadge.value}}
    state: {{pluginBadge.state}}
    icon: {{pluginBadge.icon}}
    style: {{pluginBadge.style}}
    shape: {{pluginBadge.shape}}
    size: {{pluginBadge.size}}
    displayLabel: {{pluginBadge.displayLabel}}
  }
  action {{action.staticId}} (
    position: link
    layout {
      sequence: {{action.layout.sequence}}
    }
    behavior {
      type: {{action.behavior.type}}
      target: {{action.behavior.target}}
      targetUrl: {{action.behavior.targetUrl}}
      linkAttributes: {{action.behavior.linkAttributes}}
    }
    security {
      authorizationScheme: {{action.security.authorizationScheme}}
    }
  )
  rowSelection {
    type: {{rowSelection.type}}
    currentSelectionPageItem: {{rowSelection.currentSelectionPageItem}}
    selectAllPageItem: {{rowSelection.selectAllPageItem}}
  }
  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
    noDataFoundIcon: {{messages.noDataFoundIcon}}
  }
  pagination {
    entitiesPerPage: {{pagination.entitiesPerPage}}
  }
  column {{column.name}} (
    layout {
      sequence: {{column.layout.sequence}}
    }
    source {
      databaseColumn: {{column.source.databaseColumn}}
      dataType: {{column.source.dataType}}
      primaryKey: {{column.source.primaryKey}}
    }
  )
  {{columns}}
  security {
    authorizationScheme: {{security.authorizationScheme}}
  }
)
```

# Conditional Rendering Rules

- Do not omit the region `appearance {}` block.
- For dashboard KPI strips, default to `appearance.template: @/blank-with-attributes` to avoid visible standard region chrome.
- Use `appearance.template: @/standard` only when the design explicitly needs a titled or landmarked visible region wrapper.
- Keep avatar or meta blocks only when the owning design requires them.
- Keep metric-card-specific layout settings in the `settings` block.
- In partial mode, omit `settings.layout`, `settings.itemCssClasses`, `plugin-grouping`, `rowSelection`, `messages`, and `pagination`; APEX 26.1 rejects those report-scoped properties in partial mode.
- Metric Card `settings` may include title/metric/meta bindings plus their CSS-class companions, layout tokens, and item-level CSS classes from `metric-card._template_options.md`.
- Bind query-backed `settings.title`, `settings.metric`, and `settings.meta` text to `&COLUMN_NAME.` substitutions.
- Metric Card rendered-text settings do not need to have the same names as child columns. Bind `settings.title`, `settings.metric`, and `settings.meta` to literals or `&COLUMN_NAME.` substitutions as needed; use bare aliases for source-selector plugin attributes.
- For Metric Card avatar rendering, use `plugin-avatar.displayAvatar` for visibility and keep avatar configuration in `plugin-avatar`. Emit exactly one of `icon`, `initials`, or `image` to match `type`.
- Avatar icons may be static Font APEX literals or `&COLUMN.` substitutions. A source-backed icon column must be `varchar2`, and every SQL literal or CASE result must be provable against the pinned Font APEX catalogue.
- Use a bare projected `varchar2` alias for `plugin-avatar.initials`. Use `alignment` only with `position: inline`.
- Emit `plugin-avatar.style: subtle` only for `type: icon` or `type: initials`; omit `style` for `type: image`.
- For `plugin-avatar.type: image`, emit the nested `image: { ... }` object using the accepted source mode. The export-backed blob-column shape is `type: blobColumn` plus typed `blobColumn`, `filenameColumn`, `mimeTypeColumn`, and `lastUpdatedColumn` aliases. URL-column images must be projected from `:APP_FILES` or `:APEX_FILES` plus one static relative path; static URL images use the matching `#APP_FILES#` or `#APEX_FILES#` path.
- For Metric Card badge rendering, use `plugin-badge.displayBadge` for visibility and keep badge configuration in `plugin-badge`. Emit both `label` and `value`; source-backed label/value/state selectors use bare projected aliases.
- Keep optional badge state values restricted to lowercase `danger`, `warning`, `success`, or `info`, matching the Badge contract introduced by the standalone Badge implementation.
- Keep `plugin-grouping` only for grouped report output. Emit a static catalogue-listed Font APEX `groupIcon` only with `groupTitle`, mark the grouping child column with `appearance.group: true`, and place grouped columns first in deterministic ordering.
- Omit `advanced { htmlDomId: ... }` unless external page logic must target a known rendered DOM id. Native runtime behavior can use the generated region id without requiring an explicit `htmlDomId`.
- A Metric Card region may render multiple cards from multiple result rows.
- When the page needs several independent metrics in one Metric Card region, prefer a normalized multi-row source with one row per card.
- The default SQL pattern for independent aggregates is `UNION ALL` across per-metric SELECTs that project the same aliases in the same order, for example a card title/label column plus a metric value column.
- Do not emit `settings.displayAvatar` for Metric Card; use `plugin-avatar.displayAvatar` instead.
- Do not emit `settings.displayBadge` for Metric Card; use `plugin-badge.displayBadge` instead.
- Use `rowSelection` only when the Metric Card region truly participates in row-selection behavior; otherwise omit it.
- In report mode, `messages` may contain only `whenNoDataFound` and `noDataFoundIcon`, and `pagination` may contain only `entitiesPerPage`.
- For `rowSelection.type: focusOnly`, emit only the `type` property and no selection page items.
- For `rowSelection.type: singleSelection`, emit `currentSelectionPageItem` and omit `selectAllPageItem`.
- For `rowSelection.type: multipleSelection`, emit both `currentSelectionPageItem` and `selectAllPageItem`.
- When any `rowSelection` mode is used, keep one child column marked with `source.primaryKey: true`.
- Emit an `action` only when navigation or a trigger action is requested. Use `position: link`, include deterministic `layout.sequence`, and omit `template` and `label` because this Metric Card position supplies neither action templates nor a label feature.
- Pair `redirectThisApp`/`redirectOtherApp` with `target`, pair `redirectUrl` with a reviewed `targetUrl`, and emit neither target property for `triggerAction`.
- Reject unsafe `targetUrl` values, including `javascript:`, `data:`, `vbscript:`, protocol-relative URLs, control characters, and wholly dynamic destinations that cannot be reviewed. Allow substitutions only inside query parameters; the scheme, host, path, and fragment must remain static. Use structured targets instead of same-app `f?p=` URLs.
- Keep `linkAttributes` static and reject inline event handlers, URL-bearing attributes such as `href`, scriptable CSS, unsafe URL schemes, and `target="_blank"` without `rel="noopener"` or `rel="noreferrer"`.
- For a same-app target, use a declarative `behavior.target` object and pass row values with escaped `&COLUMN.` substitutions only from projected columns.
- Omit region/action `security` when page authentication is sufficient. When stricter AuthZ is required, reference an existing authorization scheme and apply it at the narrowest relevant scope.
- In report mode, emit explicit child `column (...)` metadata for every delivered source projection before finals.
- Do not stop after the first compiler-satisfying child column when the source projects multiple fields.
- For child column `source.dataType`, emit only exact values from the Metric Card Column Data Types inventory; do not normalize them to uppercase SQL names or Interactive Report `STRING`/`NUMBER`/`DATE` tokens.
- When the agent cannot rely on `column-metric-card` helper coverage, fall back to the explicit multiline child-column skeleton shown in this file.

# Guardrails

- Metadata export lookup: search for `Metric Card` and `themeTemplateComponent/metricCard`; compiler truth resolves its child columns to `column-f`.
- If the requested Metric Card behavior depends on external page logic targeting the region container directly, treat the chosen region template plus optional `advanced.htmlDomId` as part of the runtime contract, not as incidental styling.
- Do not place presentation HTML in the Metric Card SQL source. Project raw values and render them through native settings and action attributes.
- Do not expose sensitive metrics solely by hiding card markup. Enforce access through authenticated pages, verified authorization schemes, and source predicates where row-level filtering is required.

# Validation Checklist

- `type` is `themeTemplateComponent/metricCard` and `componentAppearance.display` is `partial` or `report`.
- Partial mode omits every report-scoped setting and block; report mode may use layout, grouping, selection, messages, and `pagination.entitiesPerPage`.
- `settings.metric` is present; query-backed title/metric/meta mappings use `&COLUMN.` syntax.
- Every source projection has a matching child `column (...)` with a valid Metric Card data type.
- Optional layout, grouping, and row-selection values use compiler-backed enums.
- Optional avatar and badge blocks satisfy their type/payload dependencies, selector mappings, data types, and compiler-backed enums.
- Badge label/value are present whenever `displayBadge: true`; optional state values use the Badge allowlist.
- Optional row navigation uses only `action.position: link`, a declarative behavior, and no action template.
- Page authentication is present; any stricter region/action authorization references an existing scheme.
