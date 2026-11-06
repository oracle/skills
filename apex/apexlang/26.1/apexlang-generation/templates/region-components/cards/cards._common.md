---
templateId: region.cards.common
componentType: region
version: 1.0
description: Shared contract for cards regions.
---

# Purpose

Standardize the output shape, variable contracts, metadata lookup anchors, and guardrails for cards regions using SQL or REST sources.

# Generation Rules (MANDATORY)

1. Use the dedicated `region-card` template variant.
2. Keep cards metadata lookup anchored on region type `Cards` and the `column-card` child template.
3. When cards display images, use the native cards `media` block with exactly one source-specific value mapping: `blobColumn`, `urlColumn`, or `imageUrl`.
4. Emit `blobAttributes` only when `media.source: blobColumn` is selected; use it only for supported companion metadata column aliases.
5. Direct-source media must emit `advancedFormatting: false`, `position: first | body | background`, and `sizing: fit | cover`; `appearance: square | widescreen` is optional.
6. When cards need row navigation, emit an action `type`, `layout.sequence`, `behavior.type`, and its matching target. Only `type: button` emits a `label` and `layout.position: primary | secondary`. Keep each action's sequence explicit so full-card and decision-button ordering is deterministic.
7. Before rendering, freeze a source-to-attribute plan for title, subtitle, body, secondary body, row identity, icon, image, badge, link, and conditional style. Each requested role must resolve to an SQL projection alias or authoritative REST data-profile column.
8. Emit `componentAppearance.layout: grid`, `float`, or `horizontal` from explicit layout intent. Emit `gridColumns` only with `layout: grid` for an explicit `2`, `3`, `4`, or `5` column requirement, and use `cssClasses` only for a proven container class.
9. When Cards need dynamic refresh, name the trigger and Cards region static ID, use the supported dynamic-action Refresh capability, and submit every page item read by the refreshed source.
10. Do not generate Faceted Search, Smart Filters, search items, facets, filter blocks, or filter orchestration as part of the visual-summary Cards pattern.
11. Apply the authenticated-page baseline, use an existing region authorization scheme when Cards data is more restricted than the page, escape every untrusted advanced-formatting substitution with `!HTML`, and authorize every navigation target independently.
12. For REST-backed Cards, reference a declared shared REST Data Source, HTTPS REST Data Source Server, and Web Credential; never emit credentials or literal endpoints in the Cards region, and require `advanced.validForUrls` to contain the exact resolved server plus source-path prefix.
13. Emit exactly one complete Cards source shape. SQL requires `location: localDatabase`, `type: sqlQuery`, and `sqlQuery`; REST requires `location: restSource` and `restSource: @alias` with no SQL source properties.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Region static identifier. |
| name | yes | string | Region name. |
| source | yes | object | `localDatabase/sqlQuery` or `restSource`. |
| layout.sequence | yes | number | Region order. |
| layout.slot | yes | enum | Page slot. |
| appearance.templateOptions | optional | array | Use the accepted values from `cards._template_options.md`, such as `style-a`, `style-b`, or `style-c`. Do not substitute emitted CSS class strings. |
| componentAppearance.layout | yes | enum | Use explicit `grid`, `float`, or `horizontal` intent; `gridColumns` applies only to `grid`. |
| componentAppearance.gridColumns | optional | enum | Forces a 2-, 3-, 4-, or 5-column cards grid. Omit only this property for automatic responsive sizing. |
| componentAppearance.cssClasses | optional | array | Classes applied to the Cards container. Use only for a proven class requirement; prefer native layout and template options. |
| card.primaryKeyColumn1 | optional | string | Primary-key column used in the card block; maps to the native cards `primaryKeyColumn1` property. |
| card.primaryKeyColumn2 | optional | string | Second primary-key column when the source has a composite identity; requires `card.primaryKeyColumn1`. |
| card.cssClasses | optional | array | Conditional per-row card classes. Reference exactly one source-projected alias proven to return only `u-normal`, `u-hot`, `u-info`, `u-success`, `u-warning`, `u-danger`, or `NULL`. |
| security.authorizationScheme | optional | reference | Existing shared authorization scheme required when Cards data is more restricted than the page. Never invent the alias. |
| title.column | conditional | string | Primary card title column when the title uses direct column rendering instead of `htmlExpression`. |
| title.advancedFormatting | yes | boolean | Use `false` with `column`; use `true` with `htmlExpression`. |
| subtitle.column | conditional | string | Secondary label column when the subtitle uses direct column rendering instead of `htmlExpression`. |
| subtitle.advancedFormatting | conditional | boolean | Required when subtitle is emitted: `false` with `column`, `true` with `htmlExpression`. |
| body.advancedFormatting | conditional | boolean | Required when body is emitted: `false` with `column`, `true` with `htmlExpression`. |
| iconAndBadge.iconSource | optional | string | `iconClass`, `iconClassColumn`, `initials`, `imageUrl`, or `imageBlobColumn`. |
| iconAndBadge.iconColumn | optional | string | Required when `iconSource` is `iconClassColumn` or `initials`; points to the SQL column that supplies the value. |
| iconAndBadge.iconCssClasses | optional | string | Optional CSS classes for the icon item. When `iconSource` is `iconClass`, this value is required and must include a Font APEX icon class prefixed with `fa `. |
| iconAndBadge.imageColumn | conditional | string | Required for `iconSource: imageBlobColumn`. |
| iconAndBadge.imageUrl | conditional | string | Required for `iconSource: imageUrl`. |
| iconAndBadge.iconPosition | conditional | enum | Required whenever `iconSource` is set: `top`, `start`, or `end`. |
| iconAndBadge.iconDescription | optional | string | Brief description of the icon item. |
| iconAndBadge.badgeColumn | optional | string | Required when badge mode is used; points to the SQL column that supplies the badge metric or status. |
| iconAndBadge.badgeLabel | optional | string | Optional label shown with the badge. |
| iconAndBadge.badgeCssClasses | optional | array | Optional CSS classes that augment the badge. |
| title | yes | object | Column-based or htmlExpression title. Emit either `column` or `htmlExpression`, not both. When using `htmlExpression`, emit `advancedFormatting: true`. |
| subtitle | optional | object | Column-based or htmlExpression subtitle. Emit either `column` or `htmlExpression`, not both. When using `htmlExpression`, emit `advancedFormatting: true`. |
| body | optional | object | Column-based or htmlExpression body. Emit either `column` or `htmlExpression`, not both. When using `htmlExpression`, emit `advancedFormatting: true`. |
| secondaryBody.advancedFormatting | conditional | boolean | Required when secondary body is emitted: `false` with `column`, `true` with `htmlExpression`. |
| secondaryBody | optional | object | Supplemental content. Emit either `column` or `htmlExpression`, not both. When using `htmlExpression`, emit `advancedFormatting: true`. |
| media.source | conditional | enum | Use `blobColumn`, `urlColumn`, or `imageUrl` according to the image source. |
| media.blobColumn | conditional | string | Required only when `media.source: blobColumn`; SQL projection alias for the raw BLOB image column. |
| media.urlColumn | conditional | string | Required only when `media.source: urlColumn`; SQL projection alias containing image URLs. |
| media.url | conditional | string | Required only when `media.source: imageUrl`; use an application-static relative URL or an evidenced, allowlisted HTTPS source. Reject active-content and protocol-relative schemes. |
| media.advancedFormatting | conditional | boolean | Required when media is emitted; use `false` for native image sources. |
| media.position | conditional | enum | Required when media is emitted: `first`, `body`, or `background`. |
| media.appearance | optional | enum | Non-default media appearance: `square` or `widescreen`. |
| media.sizing | conditional | enum | Required for a native media source: `fit` or `cover`. |
| media.imageDescription | optional | string | Accessible image description sourced from trusted text or a projected description alias. |
| blobAttributes.mimeTypeColumn | optional | string | SQL projection alias for the image MIME type column; valid only with `media.source: blobColumn`. |
| blobAttributes.lastUpdatedColumn | optional | string | SQL projection alias for the image last-updated column; valid only with `media.source: blobColumn`. |
| action.type | conditional | enum | Required for an action: `button`, `fullCard`, `title`, `subtitle`, or `media`. |
| action.label | conditional | string | Required only for `action.type: button`; omit for all other action types. |
| action.layout.sequence | conditional | number | Required when a Cards action is emitted. |
| action.layout.position | conditional | enum | Required only for `action.type: button`: `primary` or `secondary`. |
| action.behavior.type | conditional | enum | Required for an action; use `redirectThisApp` for same-app Cards navigation. |
| action.behavior.target.page | conditional | number | Target page for the row navigation action. |
| action.behavior.target.items | conditional | object | Target page item mappings. Derive target page item and source column mappings from the UX contract, form PK metadata, or schema FK/PK evidence. |
| action.appearance.displayType | optional | enum | Button-only presentation: `text`, `icon`, or `textWithIcon`. `icon` is required for the latter two. |
| action.appearance.icon | conditional | string | Button icon required when `appearance.displayType` is `icon` or `textWithIcon`. |
| action.appearance.hot | optional | boolean | Button-only hot presentation flag. |
| action.appearance.cssClasses | optional | array | Button-only presentation classes; prefer native display options first. |
| action.advanced.staticId | optional | string | Explicit action static ID. |
| action.serverSideCondition | optional | object | Compiler-backed server-side condition; use its matching conditional fields and `executeCondition` for all types except `never`. |
| action.triggerAction.action | conditional | string | Nested supported UI action reference required when `behavior.type: triggerAction`; omit navigation target properties in that behavior. |
| columns | not supported | n/a | Do not emit report-style child `column (...)` blocks for cards regions unless a future compiler contract explicitly proves support. |

# Source-to-Attribute Mapping

Create this compact plan before selecting the SQL or REST template:

| Requested role | Evidence and mapping rule |
|---|---|
| Title | Required. Map one proven alias/profile column to `title.column`; use `htmlExpression` only for required composition. |
| Subtitle/body/secondary body | Optional. Map only requested roles and omit unmapped blocks. |
| Primary key | Use a proven stable identity field for navigation and whenever BLOB media requires `card.primaryKeyColumn1`. |
| Icon | Use a pinned fixed Font APEX icon, a proven icon-class column, or a proven initials column. |
| Image | Select exactly one BLOB, URL-column, or direct-URL media shape. |
| Badge | Map a proven status or metric column through `iconAndBadge.badgeColumn`. |
| Link | Prove the target page, target item, and projected source key before emitting the action. |
| Conditional style | Project an allowlisted semantic class token and map it to `card.cssClasses` after active-build compiler confirmation. |

- For `localDatabase/sqlQuery`, every mapped alias must appear in the SQL projection and every database object/column must have authoritative object evidence.
- For `restSource`, the shared REST Data Source and complete data profile must already exist or be generated from an authoritative specification/response. Map the profile's actual column names; do not infer JSON paths.
- If a requested required role remains unresolved, stop with `Missing Inputs`. Omit unresolved optional roles rather than inventing aliases.
- Prefer direct column mappings with `advancedFormatting: false`. When advanced formatting is necessary, set it to `true`, omit `column`, and use escaped `&COLUMN!HTML.` substitutions for text.

# Output Template – Full

```apexlang
region {{regionStaticId}} (
  name: {{name}}
  type: cards
  source {
    location: {{source.location}}
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  card {
    primaryKeyColumn1: {{card.primaryKeyColumn1}}
  }
  media {
    advancedFormatting: false
    source: {{media.source}}
    {{media.sourceValueProperty}}: {{media.sourceValue}}
    position: {{media.position}}
    sizing: {{media.sizing}}
  }
  blobAttributes {
    mimeTypeColumn: {{blobAttributes.mimeTypeColumn}}
    lastUpdatedColumn: {{blobAttributes.lastUpdatedColumn}}
  }
  componentAppearance {
    layout: {{componentAppearance.layout}}
    gridColumns: {{componentAppearance.gridColumns}}
    cssClasses: {{componentAppearance.cssClasses}}
  }
)
```

In the template above, `{{media.sourceValueProperty}}` / `{{media.sourceValue}}` is schematic. Emit exactly one concrete source-value property according to this mapping:

| media.source | Required value property |
|--------------|-------------------------|
| `blobColumn` | `blobColumn` |
| `urlColumn` | `urlColumn` |
| `imageUrl` | `url` |

# Media Source Shapes

Use exactly one of these source-specific shapes when a Cards region needs media:

```apexlang
media {
    advancedFormatting: false
    source: blobColumn
    blobColumn: <BLOB_COLUMN_ALIAS>
    position: first
    sizing: cover
}
blobAttributes {
    mimeTypeColumn: <MIME_TYPE_COLUMN_ALIAS>
    lastUpdatedColumn: <LAST_UPDATED_COLUMN_ALIAS>
}
```

```apexlang
media {
    advancedFormatting: false
    source: urlColumn
    urlColumn: <URL_COLUMN_ALIAS>
    position: first
    sizing: cover
}
```

```apexlang
media {
    advancedFormatting: false
    source: imageUrl
    url: <STATIC_IMAGE_URL_OR_COLUMN_SUBSTITUTION>
    position: first
    sizing: cover
}
```

## Media Presentation

For native media sources, default to `position: first` and `sizing: cover`. Use the other grammar-backed values only when the design calls for them:

```apexlang
position: first
appearance: square
sizing: cover
```

# Row Navigation Action Shape

Use this native Cards action shape when each card row should navigate to a target page:

```apexlang
action action (
    type: fullCard
    layout {
        sequence: {{actionSequence}}
    }
    behavior {
        type: redirectThisApp
        target: {
            page: {{targetPage}}
            items: {
                {{targetPageItem}}: &{{sourceColumn}}.
            }
            clearCache: {{targetPage}}
        }
    }
)
```

Use `fullCard`, `title`, `subtitle`, or `media` for non-button navigation; these types omit `label` and `layout.position`. A button action instead requires both `label` and `layout.position: primary | secondary` and may add a native `appearance` block. `behavior.type: redirectThisApp` requires the declarative `behavior.target` object; `redirectOtherApp` also requires `target`, `redirectUrl` requires `targetUrl`, and `triggerAction` emits neither navigation target property but requires a nested supported UI action reference:

```apexlang
action action (
    type: button
    label: Approve
    layout {
        position: primary
        sequence: 20
    }
    appearance {
        displayType: textWithIcon
        icon: fa-check
        hot: true
    }
    behavior {
        type: triggerAction
    }
    triggerAction approve-action (
        action: approve
    )
)
```

Use `advanced { staticId: ... }` and `serverSideCondition { ... }` only when the corresponding action requirement is evidenced. If full-card and decision-button actions coexist, document precedence and evidence-backed conditions. Do not infer business-condition exclusivity.

Derive `{{targetPageItem}}` and `{{sourceColumn}}` from one of these evidence sources before emitting the action:

- UX contract navigation or modal target mapping.
- Target form primary-key item metadata.
- Schema FK/PK evidence tying the source row to the target page entity.

# Icon Source Shapes

When `iconSource` is present, always emit `iconPosition: top | start | end` and exactly one matching source-value property:

| iconSource | Required source-value property |
|---|---|
| `iconClass` | `iconCssClasses` |
| `iconClassColumn` | `iconColumn` |
| `initials` | `iconColumn` |
| `imageUrl` | `imageUrl` |
| `imageBlobColumn` | `imageColumn` |

Badge-only cards omit `iconSource`, all icon source-value properties, and `iconPosition`; they may still emit `badgeColumn`, `badgeLabel`, and `badgeCssClasses`.

# Conditional Style Shape

Conditional styling is source-driven and bounded:

1. Derive the token through trusted SQL `CASE`/literal logic or an authoritative REST profile enum; a raw end-user or service-provided class column is not evidence.
2. Permit only `u-normal`, `u-hot`, `u-info`, `u-success`, `u-warning`, `u-danger`, or `NULL`.
3. Map the projected alias to `card.cssClasses`, for example `["&CARD_CSS_CLASSES."]`, only after active-build compiler confirmation.
4. Keep status text in `badgeColumn` even when a conditional class is also present.

Do not accept arbitrary class names from end-user input, invent Universal Theme classes, concatenate CSS in HTML expressions, or render badge HTML when the native badge contract is sufficient. If the active compiler exposes no safe property for the requested conditional style, keep the semantic status visible as text/badge content and stop before inventing a workaround.

# Dynamic Refresh Shape

- A refresh plan must identify the event source, the Cards region static ID, and any page items read by the Cards source.
- Use the compiler-supported dynamic-action Refresh capability and target only the Cards region.
- For SQL that binds page items, emit those items in `source.pageItemsToSubmit` so Ajax refresh sees current browser state.
- After a modal create/edit flow, refresh Cards on dialog close when the changed row can affect the visible result set.
- Do not add polling, JavaScript refresh code, or an `autoRefresh` block unless the request explicitly requires polling and compiler truth proves the exact active-build shape.
- Load and emit the exact Cards-owned `cards.refresh-on-change.md` or `cards.refresh-after-dialog.md` template. Refresh actions emit `execution.sequence` and `fireOnInit: false`; they do not emit action-level `execution.event` or `itemsToSubmit` settings.

# Security Shape

- Require authenticated access for business-data Cards pages. If the Cards source is more restricted than the page, emit `security { authorizationScheme: @<EXISTING_ALIAS> }` on the region.
- Authorization is independent at each boundary: Cards visibility, action availability, target page/process, and REST service authorization. A hidden action never replaces target authorization.
- Advanced HTML expressions use `&COLUMN!HTML.` for every database or REST text value. Reject raw HTML/script/event attributes and unescaped substitutions.
- Prefer same-app declarative targets. Literal external URLs require HTTPS; reject HTTP, substitutions in external targets, `javascript:`, `data:`, protocol-relative URLs, embedded credentials, path traversal, and unrestricted user-supplied destinations.
- Prove SQL media URL columns through literal or `CASE` projection results. For REST media URL columns, record `authoritative-profile-url-prefixes: [...]` in `comments.comments`, using exact HTTPS prefixes or `application-static-relative`.
- REST credentials belong to shared APEX Web Credentials, with `advanced.validForUrls` restricted to the exact resolved server plus source-path prefix. Never emit tokens, passwords, API keys, authorization headers, or secret query parameters in page or region APEXlang.

# Responsive Layout Shape

- Emit `componentAppearance.layout: grid`, `float`, or `horizontal` from explicit intent. Omit `gridColumns` for `float` and `horizontal`; with `grid`, emit it only for an explicit fixed count of `2`, `3`, `4`, or `5`.
- Use `componentAppearance.cssClasses` only for a proven container class requirement; prefer native layout and template options.
- Do not invent breakpoints, row spans, or CSS overrides to force the Cards layout.

# Conditional Rendering Rules

- For BLOB-backed Cards images, project the raw BLOB expression in SQL for display only, keep companion image metadata columns projected when available, define `card.primaryKeyColumn1`, and emit `media { source: blobColumn blobColumn: <BLOB_COLUMN_ALIAS> }`.
- Do not use the raw BLOB alias as a comparison key; sorting, grouping, distincting, joining, analytic keys, and filter comparisons must follow `SQL_PLSQL_LOB_COMPARISON_KEY_FORBIDDEN_001` in `20-data/apex.sql.md`.
- When companion metadata columns are available for a BLOB-backed Cards image, emit `blobAttributes { mimeTypeColumn: <MIME_TYPE_ALIAS> lastUpdatedColumn: <LAST_UPDATED_ALIAS> }` after the `media` block.
- Emit `blobAttributes` if and only if `media.source: blobColumn` is present. Do not emit `blobAttributes` for non-BLOB media sources or when the Cards region has no `media` block.
- For URL-column Cards images, project the URL column in SQL and emit `media { source: urlColumn urlColumn: <URL_COLUMN_ALIAS> }`.
- For direct image URL Cards images, emit `media { source: imageUrl url: <APPLICATION_STATIC_RELATIVE_URL> }` only after URL policy validation. Use `urlColumn` for a projected URL, and require its SQL expression or authoritative REST profile constraint to prove an application-static relative path or an allowlisted HTTPS origin.
- In any Cards `media` block, emit at most one source-specific value property: `blobColumn` with `source: blobColumn`, `urlColumn` with `source: urlColumn`, or `url` with `source: imageUrl`.
- Direct-source media emits `advancedFormatting: false`, required `position: first | body | background`, and required `sizing: fit | cover`; default to `first` and `cover`.
- Keep BLOB-backed media attributes in the dedicated `media` block. Do not model Cards BLOB images with report-style `column (...)` blocks or report BLOB length expressions.
- Use card-level actions only when the owning design requires row navigation.
- Native Cards actions use the type-conditional action contract: button actions require `label` and `layout.position`; full-card/title/subtitle/media actions omit both. Button presentation may use `appearance.displayType`, `icon`, `hot`, and `cssClasses`; actions may use `advanced.staticId` and `serverSideCondition`. Declarative same-app `behavior.target` is preferred.
- `behavior.type: triggerAction` requires a nested `triggerAction` child with `action`, and omits both `target` and `targetUrl`. Redirect behaviors use only their matching target property.
- If full-card and decision-button interactions compete, document the intended precedence and evidence-backed business conditions in the UX contract; do not infer exclusivity from action declarations alone.
- Every source column referenced in a Cards action item mapping such as `&{{sourceColumn}}.` must be projected by the Cards source.
- Default card-region display style uses the base cards template with no additional style token in `appearance.templateOptions`.
- If the design calls for Style A, add `style-a` to `appearance.templateOptions`.
- If the design calls for Style B, add `style-b` to `appearance.templateOptions`; this style centers the title and subtitle and uses a larger card presentation.
- If the design calls for Style C, add `style-c` to `appearance.templateOptions`.
- `iconAndBadge` may include both icon properties and badge properties in the same card configuration when the design calls for both.
- When a cards design calls for a badge, prefer the native `iconAndBadge.badgeColumn` contract over rendering badge markup inside `title`, `subtitle`, `body`, or `secondaryBody` HTML.
- Use HTML-rendered badge markup inside `title`, `subtitle`, `body`, or `secondaryBody` only as a documented fallback when the native cards badge cannot satisfy a confirmed runtime requirement such as unsupported placement or styling.
- Use icon properties when the card should display an icon and badge properties when the card should display a metric or status.
- If `iconAndBadge.iconSource` is `iconClass`, then `iconAndBadge.iconCssClasses` is required and must reference a Font APEX icon class prefixed with `fa `.
- If `iconAndBadge.iconSource` is `iconClassColumn`, then `iconAndBadge.iconColumn` is required and should point to a SQL column that stores the icon class.
- If `iconAndBadge.iconSource` is `initials`, then `iconAndBadge.iconColumn` is required and should point to a SQL column that stores the initials.
- If `iconAndBadge.iconSource` is `imageUrl`, then `iconAndBadge.imageUrl` is required.
- If `iconAndBadge.iconSource` is `imageBlobColumn`, then `iconAndBadge.imageColumn` is required.
- Whenever `iconAndBadge.iconSource` is set, `iconAndBadge.iconPosition: top | start | end` is required.
- If badge mode is used, then `iconAndBadge.badgeColumn` is required while `iconAndBadge.badgeLabel` and `iconAndBadge.badgeCssClasses` remain optional.
- If `title.column` is emitted, set `title.advancedFormatting: false` and omit `title.htmlExpression`.
- If `title.htmlExpression` is emitted, then `title.advancedFormatting` must also be emitted with value `true`, and `title.column` must be omitted.
- If `subtitle.column` is emitted, set `subtitle.advancedFormatting: false` and omit `subtitle.htmlExpression`.
- If `subtitle.htmlExpression` is emitted, then `subtitle.advancedFormatting` must also be emitted with value `true`, and `subtitle.column` must be omitted.
- If `body.column` is emitted, set `body.advancedFormatting: false` and omit `body.htmlExpression`.
- If `body.htmlExpression` is emitted, then `body.advancedFormatting` must also be emitted with value `true`, and `body.column` must be omitted.
- If `secondaryBody.column` is emitted, set `secondaryBody.advancedFormatting: false` and omit `secondaryBody.htmlExpression`.
- If `secondaryBody.htmlExpression` is emitted, then `secondaryBody.advancedFormatting` must also be emitted with value `true`, and `secondaryBody.column` must be omitted.
- Inside cards `title.htmlExpression`, `subtitle.htmlExpression`, `body.htmlExpression`, and `secondaryBody.htmlExpression`, use APEX substitution strings in the `&COLUMN.` form, not `#COLUMN#`.
- Prefer escaped substitutions such as `&COLUMN!HTML.` when inserting user or database text into cards `htmlExpression`.
- Emit `componentAppearance.layout: grid`, `float`, or `horizontal` only from explicit layout intent; emit `gridColumns` only for `layout: grid` and an explicit fixed cards grid width or card column count.
- If emitted, `componentAppearance.gridColumns` must be one of `2`, `3`, `4`, or `5`; omit it for `float` and `horizontal`.
- When Cards refresh depends on page items, every bind item must appear in `source.pageItemsToSubmit`.
- Conditional styling must use a projected allowlisted token mapped through compiler-confirmed `card.cssClasses`; otherwise retain semantic badge/text content without the requested style.
- Do not add report-style child `column (...)` blocks to cards regions. Cards column mapping is expressed through native cards blocks such as `card`, `title`, `subtitle`, `body`, `secondaryBody`, and `iconAndBadge`.
- When a Cards region displays a BLOB image, `media.blobColumn` must reference the raw BLOB projection alias from the region SQL.
- When `blobAttributes` is emitted, every referenced metadata alias must be projected by the same SQL source.
- When a Cards region displays URL-column media, `media.urlColumn` must reference the URL projection alias from the region SQL.
- When a Cards region displays `imageUrl` media with substitution syntax, the substitution alias must be projected by the same SQL source.

# Guardrails

- Use `appearance.template: @/cards-container` for cards regions.
- Emit at most one of `style-a`, `style-b`, or `style-c` for any one cards region.
- Keep `templateOptions` to exact accepted values. `style-a` is valid when documented; `t-CardsRegion--styleA` is not.
- Ensure all referenced columns exist in the selected source.
- Do not leave image-bearing source columns unmapped when the requested cards design explicitly calls for images or thumbnails.
- Do not emit a generic `image` block for cards regions in this runtime; use the native `media` block instead.
- Do not render a cards badge as ad-hoc HTML when the same outcome can be expressed with native `iconAndBadge.badgeColumn`, `badgeLabel`, and `badgeCssClasses`.
- Do not emit cards identity or pagination properties unless explicitly confirmed by the active compiler contract.
- Do not use report-only cards properties such as `performance.maxRowsToProcess`.
- Emit `layout.position` only for `action.type: button`; it is required for buttons and invalid for the other Cards action types. Keep `layout.sequence` numeric and explicit for every Cards action.
- Do not generate Faceted Search, Smart Filters, search fields, facets, filter blocks, or filter-specific dynamic actions under the visual-summary Cards pattern. If filtering/search is requested, route to that owning page pattern and use Cards only as its results region.
- Do not implement Cards refresh with ad-hoc JavaScript when the native dynamic-action Refresh capability satisfies the requirement.
- Keep media properties within the grammar-backed set: `advancedFormatting`, `htmlExpression`, `source`, `blobColumn`, `urlColumn`, `url`, `position`, `appearance`, `sizing`, `cssClasses`, and `imageDescription`; keep `blobAttributes` to `mimeTypeColumn` and `lastUpdatedColumn`.
- Keep HTML expressions small and escaped when output includes user data.
- Never place REST credentials, endpoint literals, or authentication headers in a Cards source. Reference the existing shared REST Data Source alias and validate its Web Credential URL restriction separately.
- Metadata export lookup: search for `Cards`, `column-card`, and card attribute names used by the owning region.
