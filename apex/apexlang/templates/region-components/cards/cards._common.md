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
5. Emit media presentation properties only for meaningful non-default values: `position: first | background`, `appearance: square | widescreen`, and `sizing: cover`.
6. When cards need row navigation, emit native Cards `action` blocks with `label`, `layout.sequence`, and declarative `behavior.target`; native Cards actions must not emit `position`.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Region static identifier. |
| name | yes | string | Region name. |
| source | yes | object | `localDatabase/sqlQuery` or `restSource`. |
| layout.sequence | yes | number | Region order. |
| layout.slot | yes | enum | Page slot. |
| appearance.templateOptions | optional | array | Use the accepted values from `cards._template_options.md`, such as `style-a`, `style-b`, or `style-c`. Do not substitute emitted CSS class strings. |
| componentAppearance.gridColumns | optional | enum | Forces a 2-, 3-, 4-, or 5-column cards grid. Emit only when the prompt explicitly specifies a grid column count; otherwise omit the entire `componentAppearance` block. |
| card.primaryKeyColumn1 | optional | string | Primary-key column used in the card block; maps to the native cards `primaryKeyColumn1` property. |
| title.column | conditional | string | Primary card title column when the title uses direct column rendering instead of `htmlExpression`. |
| title.advancedFormatting | conditional | boolean | Required and must be `true` when `title.htmlExpression` is emitted. Omit it when `title.column` is used. |
| subtitle.column | conditional | string | Secondary label column when the subtitle uses direct column rendering instead of `htmlExpression`. |
| subtitle.advancedFormatting | conditional | boolean | Required and must be `true` when `subtitle.htmlExpression` is emitted. Omit it when `subtitle.column` is used. |
| body.advancedFormatting | conditional | boolean | Required and must be `true` when `body.htmlExpression` is emitted. Omit it when `body.column` is used. |
| iconAndBadge.iconSource | optional | string | Selects the icon mode: `iconClass`, `iconClassColumn`, or `initials`. |
| iconAndBadge.iconColumn | optional | string | Required when `iconSource` is `iconClassColumn` or `initials`; points to the SQL column that supplies the value. |
| iconAndBadge.iconCssClasses | optional | string | Optional CSS classes for the icon item. When `iconSource` is `iconClass`, this value is required and must include a Font APEX icon class prefixed with `fa `. |
| iconAndBadge.iconDescription | optional | string | Brief description of the icon item. |
| iconAndBadge.badgeColumn | optional | string | Required when badge mode is used; points to the SQL column that supplies the badge metric or status. |
| iconAndBadge.badgeLabel | optional | string | Optional label shown with the badge. |
| iconAndBadge.badgeCssClasses | optional | string | Optional CSS classes that augment the badge. |
| title | yes | object | Column-based or htmlExpression title. Emit either `column` or `htmlExpression`, not both. When using `htmlExpression`, emit `advancedFormatting: true`. |
| subtitle | optional | object | Column-based or htmlExpression subtitle. Emit either `column` or `htmlExpression`, not both. When using `htmlExpression`, emit `advancedFormatting: true`. |
| body | optional | object | Column-based or htmlExpression body. Emit either `column` or `htmlExpression`, not both. When using `htmlExpression`, emit `advancedFormatting: true`. |
| secondaryBody.advancedFormatting | conditional | boolean | Required and must be `true` when `secondaryBody.htmlExpression` is emitted. Omit it when `secondaryBody.column` is used. |
| secondaryBody | optional | object | Supplemental content. Emit either `column` or `htmlExpression`, not both. When using `htmlExpression`, emit `advancedFormatting: true`. |
| media.source | conditional | enum | Use `blobColumn`, `urlColumn`, or `imageUrl` according to the image source. |
| media.blobColumn | conditional | string | Required only when `media.source: blobColumn`; SQL projection alias for the raw BLOB image column. |
| media.urlColumn | conditional | string | Required only when `media.source: urlColumn`; SQL projection alias containing image URLs. |
| media.url | conditional | string | Required only when `media.source: imageUrl`; static image URL or APEX substitution such as `&IMAGE_URL_COLUMN.`. |
| media.position | optional | enum | Non-default media position: `first` or `background`. |
| media.appearance | optional | enum | Non-default media appearance: `square` or `widescreen`. |
| media.sizing | optional | enum | Non-default media sizing: `cover`. |
| blobAttributes.mimeTypeColumn | optional | string | SQL projection alias for the image MIME type column; valid only with `media.source: blobColumn`. |
| blobAttributes.lastUpdatedColumn | optional | string | SQL projection alias for the image last-updated column; valid only with `media.source: blobColumn`. |
| action.label | conditional | string | Required when a Cards action is emitted. Keep the label concise. |
| action.layout.sequence | conditional | number | Required when a Cards action is emitted. |
| action.behavior.target.page | conditional | number | Target page for the row navigation action. |
| action.behavior.target.items | conditional | object | Target page item mappings. Derive target page item and source column mappings from the UX contract, form PK metadata, or schema FK/PK evidence. |
| columns | not supported | n/a | Do not emit report-style child `column (...)` blocks for cards regions unless a future compiler contract explicitly proves support. |

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
    source: {{media.source}}
    {{media.sourceValueProperty}}: {{media.sourceValue}}
  }
  blobAttributes {
    mimeTypeColumn: {{blobAttributes.mimeTypeColumn}}
    lastUpdatedColumn: {{blobAttributes.lastUpdatedColumn}}
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
    source: blobColumn
    blobColumn: <BLOB_COLUMN_ALIAS>
}
blobAttributes {
    mimeTypeColumn: <MIME_TYPE_COLUMN_ALIAS>
    lastUpdatedColumn: <LAST_UPDATED_COLUMN_ALIAS>
}
```

```apexlang
media {
    source: urlColumn
    urlColumn: <URL_COLUMN_ALIAS>
}
```

```apexlang
media {
    source: imageUrl
    url: <STATIC_IMAGE_URL_OR_COLUMN_SUBSTITUTION>
}
```

## Non-Default Media Presentation

Default media presentation is represented by omission: do not emit any APEXlang-side `position`, `appearance`, or `sizing` property for default Cards media. Emit these properties only when the user or spec explicitly asks for a non-default media presentation. Never emit `position: first`, `appearance: square`, or `sizing: cover` just to mirror APEX defaults.

When a non-default presentation is required, add only the needed supported properties inside the same `media` block:

```apexlang
position: first
appearance: square
sizing: cover
```

# Row Navigation Action Shape

Use this native Cards action shape when each card row should navigate to a target page:

```apexlang
action action (
    label: {{actionLabel}}
    layout {
        sequence: {{actionSequence}}
    }
    behavior {
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

Prefer the declarative `behavior.target` object for Cards row navigation. Use `behavior.targetUrl`, `behavior.type`, or `behavior.linkAttributes` only when direct compiler truth proves the selected runtime supports the required non-declarative behavior. Native Cards actions must not emit `position`; `position` belongs to template-component actions such as Content Row, not native Cards actions.

Derive `{{targetPageItem}}` and `{{sourceColumn}}` from one of these evidence sources before emitting the action:

- UX contract navigation or modal target mapping.
- Target form primary-key item metadata.
- Schema FK/PK evidence tying the source row to the target page entity.

# Conditional Rendering Rules

- For BLOB-backed Cards images, project the raw BLOB expression in SQL for display only, keep companion image metadata columns projected when available, define `card.primaryKeyColumn1`, and emit `media { source: blobColumn blobColumn: <BLOB_COLUMN_ALIAS> }`.
- Do not use the raw BLOB alias as a comparison key; sorting, grouping, distincting, joining, analytic keys, and filter comparisons must follow `SQL_PLSQL_LOB_COMPARISON_KEY_FORBIDDEN_001` in `20-data/apex.sql.md`.
- When companion metadata columns are available for a BLOB-backed Cards image, emit `blobAttributes { mimeTypeColumn: <MIME_TYPE_ALIAS> lastUpdatedColumn: <LAST_UPDATED_ALIAS> }` after the `media` block.
- Emit `blobAttributes` if and only if `media.source: blobColumn` is present. Do not emit `blobAttributes` for non-BLOB media sources or when the Cards region has no `media` block.
- For URL-column Cards images, project the URL column in SQL and emit `media { source: urlColumn urlColumn: <URL_COLUMN_ALIAS> }`.
- For direct image URL Cards images, emit `media { source: imageUrl url: <STATIC_IMAGE_URL_OR_COLUMN_SUBSTITUTION> }`; `url` may be a hard static URL or a substitution such as `&IMAGE_URL_COLUMN.`.
- In any Cards `media` block, emit at most one source-specific value property: `blobColumn` with `source: blobColumn`, `urlColumn` with `source: urlColumn`, or `url` with `source: imageUrl`.
- Default media presentation emits no APEXlang-side `position`, `appearance`, or `sizing` property.
- Emit `position`, `appearance`, and `sizing` only for explicit non-default media presentation requirements. Accepted values are `position: first | background`, `appearance: square | widescreen`, and `sizing: cover`.
- Never emit `position: first`, `appearance: square`, or `sizing: cover` just to mirror APEX defaults.
- Keep BLOB-backed media attributes in the dedicated `media` block. Do not model Cards BLOB images with report-style `column (...)` blocks or report BLOB length expressions.
- Use card-level actions only when the owning design requires row navigation.
- Native Cards actions use `label` plus declarative `behavior.target`; do not emit `position`, `slot`, or template-component action placement properties.
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
- If badge mode is used, then `iconAndBadge.badgeColumn` is required while `iconAndBadge.badgeLabel` and `iconAndBadge.badgeCssClasses` remain optional.
- If `title.column` is emitted, omit `title.htmlExpression` and omit `title.advancedFormatting`.
- If `title.htmlExpression` is emitted, then `title.advancedFormatting` must also be emitted with value `true`, and `title.column` must be omitted.
- If `subtitle.column` is emitted, omit `subtitle.htmlExpression` and omit `subtitle.advancedFormatting`.
- If `subtitle.htmlExpression` is emitted, then `subtitle.advancedFormatting` must also be emitted with value `true`, and `subtitle.column` must be omitted.
- If `body.column` is emitted, omit `body.htmlExpression` and omit `body.advancedFormatting`.
- If `body.htmlExpression` is emitted, then `body.advancedFormatting` must also be emitted with value `true`, and `body.column` must be omitted.
- If `secondaryBody.column` is emitted, omit `secondaryBody.htmlExpression` and omit `secondaryBody.advancedFormatting`.
- If `secondaryBody.htmlExpression` is emitted, then `secondaryBody.advancedFormatting` must also be emitted with value `true`, and `secondaryBody.column` must be omitted.
- Inside cards `title.htmlExpression`, `subtitle.htmlExpression`, `body.htmlExpression`, and `secondaryBody.htmlExpression`, use APEX substitution strings in the `&COLUMN.` form, not `#COLUMN#`.
- Prefer escaped substitutions such as `&COLUMN!HTML.` when inserting user or database text into cards `htmlExpression`.
- Emit `componentAppearance.gridColumns` only when the prompt explicitly specifies a fixed cards grid width or card column count.
- Otherwise omit the entire `componentAppearance` block and allow cards to auto-determine column count.
- If emitted, `componentAppearance.gridColumns` must be one of `2`, `3`, `4`, or `5`.
- Do not add report-style child `column (...)` blocks to cards regions. Cards column mapping is expressed through native cards blocks such as `card`, `title`, `subtitle`, `body`, `secondaryBody`, and `iconAndBadge`.
- When a Cards region displays a BLOB image, `media.blobColumn` must reference the raw BLOB projection alias from the region SQL.
- When `blobAttributes` is emitted, every referenced metadata alias must be projected by the same SQL source.
- When a Cards region displays URL-column media, `media.urlColumn` must reference the URL projection alias from the region SQL.
- When a Cards region displays `imageUrl` media with substitution syntax, the substitution alias must be projected by the same SQL source.

# Guardrails

- Use `appearance.template: @/cards-container` for cards regions.
- Emit at most one of `style-a`, `style-b`, or `style-c` for any one cards region.
- Keep `templateOptions` to exact accepted values. `style-a` is valid when documented; `t-CardsRegion--styleA` is not.
- Do not emit `componentAppearance.gridColumns` with values outside `2`, `3`, `4`, or `5`.
- Ensure all referenced columns exist in the selected source.
- Do not leave image-bearing source columns unmapped when the requested cards design explicitly calls for images or thumbnails.
- Do not emit a generic `image` block for cards regions in this runtime; use the native `media` block instead.
- Do not render a cards badge as ad-hoc HTML when the same outcome can be expressed with native `iconAndBadge.badgeColumn`, `badgeLabel`, and `badgeCssClasses`.
- Do not emit cards identity or pagination properties unless explicitly confirmed by the active compiler contract.
- Do not use report-only cards properties such as `performance.maxRowsToProcess`.
- Do not emit `position` on native Cards actions.
- Do not add media properties beyond `source`, `blobColumn`, `urlColumn`, `url`, `position`, `appearance`, and `sizing`, or `blobAttributes` properties beyond `mimeTypeColumn` and `lastUpdatedColumn`, unless compiler-backed truth proves them for the active runtime.
- Keep HTML expressions small and escaped when output includes user data.
- Do not emit `title.htmlExpression` or `subtitle.htmlExpression` without `advancedFormatting: true`.
- Do not emit `body.htmlExpression` or `secondaryBody.htmlExpression` without `advancedFormatting: true`.
- Do not use `#COLUMN#` tokens inside cards `title.htmlExpression`, `subtitle.htmlExpression`, `body.htmlExpression`, or `secondaryBody.htmlExpression`; use `&COLUMN.` substitution strings instead.
- Metadata export lookup: search for `Cards`, `column-card`, and card attribute names used by the owning region.
