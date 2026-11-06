---
templateId: region.cards.standard
componentType: region
version: 1.0
imports:
  - cards._common
description: Standard SQL-backed cards region.
---

# Output Template

```
region {{regionStaticId}} (
  name: {{name}}
  type: cards
  source {
    location: localDatabase
    type: sqlQuery
    sqlQuery:
      ```sql
      {{source.sqlQuery}}
      ```
  }
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: @/cards-container
    templateOptions: #DEFAULT#
  }
  card {
    primaryKeyColumn1: {{card.primaryKeyColumn1}}
    primaryKeyColumn2: {{card.primaryKeyColumn2}}
    cssClasses: {{card.cssClasses}}
  }
  title {
    advancedFormatting: {{title.advancedFormatting}}
    {{title.valueProperty}}: {{title.value}}
  }
  subtitle {
    advancedFormatting: {{subtitle.advancedFormatting}}
    {{subtitle.valueProperty}}: {{subtitle.value}}
  }
  body {
    advancedFormatting: {{body.advancedFormatting}}
    {{body.valueProperty}}: {{body.value}}
  }
  secondaryBody {
    advancedFormatting: {{secondaryBody.advancedFormatting}}
    {{secondaryBody.valueProperty}}: {{secondaryBody.value}}
  }
  media {
    advancedFormatting: false
    source: {{media.source}}
    {{media.sourceValueProperty}}: {{media.sourceValue}}
    position: {{media.position}}
    sizing: {{media.sizing}}
    imageDescription: {{media.imageDescription}}
  }
  blobAttributes {
    mimeTypeColumn: {{blobAttributes.mimeTypeColumn}}
    lastUpdatedColumn: {{blobAttributes.lastUpdatedColumn}}
  }
  iconAndBadge {
    iconSource: {{iconAndBadge.iconSource}}
    {{iconAndBadge.sourceValueProperty}}: {{iconAndBadge.sourceValue}}
    iconPosition: {{iconAndBadge.iconPosition}}
    iconDescription: {{iconAndBadge.iconDescription}}
    badgeColumn: {{iconAndBadge.badgeColumn}}
    badgeLabel: {{iconAndBadge.badgeLabel}}
    badgeCssClasses: {{iconAndBadge.badgeCssClasses}}
  }
  messages {
    whenNoDataFound: {{messages.whenNoDataFound}}
    noDataFoundIcon: {{messages.noDataFoundIcon}}
  }
  componentAppearance {
    layout: {{componentAppearance.layout}}
    gridColumns: {{componentAppearance.gridColumns}}
    cssClasses: {{componentAppearance.cssClasses}}
  }
)
```

The `valueProperty` placeholders are schematic. For title, subtitle, body, and secondary body, emit exactly one pair: `advancedFormatting: false` plus `column`, or `advancedFormatting: true` plus `htmlExpression`. For actions, append the native action shape from `cards._common.md`; button actions may add `appearance`, `advanced`, and `serverSideCondition`, while `behavior.type: triggerAction` requires a nested `triggerAction` child and omits navigation targets. For media, emit exactly one concrete source-value property according to this mapping:

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

## Non-Default Media Presentation

Every direct-source media block emits `advancedFormatting: false`, required `position`, and required `sizing`. Use `position: first` and `sizing: cover` as deterministic defaults; emit optional `appearance` only when requested.

When a non-default presentation is required, add only the needed supported properties inside the same `media` block:

```apexlang
position: first
appearance: square
sizing: cover
```

# Conditional Rendering Rules

- Every title, subtitle, body, secondary-body, primary-key, icon, media, badge, link, or conditional-style alias used by the region must be projected by `source.sqlQuery` and proven by schema/live/user-asserted object evidence.
- Omit `card.cssClasses` unless conditional per-row styling is explicitly requested. When used, map a projected alias whose values are restricted to an active-build allowlist of semantic Universal Theme classes.
- When refreshed SQL binds page items, emit every bind item in `source.pageItemsToSubmit` and target the region static ID with the native Refresh dynamic-action capability.

- If `title.column` is emitted, set `title.advancedFormatting: false` and omit `title.htmlExpression`.
- If `title.htmlExpression` is emitted, `title.advancedFormatting` must also be emitted with value `true`, and `title.column` must be omitted.
- If `subtitle.column` is emitted, set `subtitle.advancedFormatting: false` and omit `subtitle.htmlExpression`.
- If `subtitle.htmlExpression` is emitted, `subtitle.advancedFormatting` must also be emitted with value `true`, and `subtitle.column` must be omitted.
- If `body.column` is emitted, set `body.advancedFormatting: false` and omit `body.htmlExpression`.
- If `body.htmlExpression` is emitted, `body.advancedFormatting` must also be emitted with value `true`, and `body.column` must be omitted.
- If `secondaryBody.column` is emitted, set `secondaryBody.advancedFormatting: false` and omit `secondaryBody.htmlExpression`.
- If `secondaryBody.htmlExpression` is emitted, `secondaryBody.advancedFormatting` must also be emitted with value `true`, and `secondaryBody.column` must be omitted.
- If the Cards region displays a BLOB image, project the raw BLOB column in SQL for display only, define `card.primaryKeyColumn1`, and emit `media { source: blobColumn blobColumn: <BLOB_COLUMN_ALIAS> }`.
- Do not use the raw BLOB alias as a comparison key; sorting, grouping, distincting, joining, analytic keys, and filter comparisons must follow `SQL_PLSQL_LOB_COMPARISON_KEY_FORBIDDEN_001` in `20-data/apex.sql.md`.
- Keep companion image metadata columns projected in SQL when available. If MIME type or last-updated aliases are available, emit them in `blobAttributes { mimeTypeColumn: <MIME_TYPE_ALIAS> lastUpdatedColumn: <LAST_UPDATED_ALIAS> }`.
- Emit `blobAttributes` if and only if `media.source: blobColumn` is present; do not emit it for other media sources or for Cards regions without BLOB media.
- If the Cards region displays images from a URL column, project that URL alias in SQL and emit `media { source: urlColumn urlColumn: <URL_COLUMN_ALIAS> }`.
- If the Cards region displays a static image URL or column substitution URL, emit `media { source: imageUrl url: <STATIC_IMAGE_URL_OR_COLUMN_SUBSTITUTION> }`; substitution values use APEX syntax such as `&IMAGE_URL_COLUMN.`.
- In any Cards `media` block, emit at most one source-specific value property: `blobColumn` with `source: blobColumn`, `urlColumn` with `source: urlColumn`, or `url` with `source: imageUrl`.
- Direct-source media always emits `advancedFormatting: false`, `position: first | body | background`, and `sizing: fit | cover`; default to `first` and `cover`. `appearance: square | widescreen` remains optional.
- Do not emit additional `media` or `blobAttributes` properties unless compiler-backed truth proves them.
- Do not add report-style child `column (...)` blocks for Cards BLOB display.
- Inside cards `title.htmlExpression`, `subtitle.htmlExpression`, `body.htmlExpression`, and `secondaryBody.htmlExpression`, use `&COLUMN.` substitution strings, not `#COLUMN#`.
- Emit `componentAppearance.layout: grid`, `float`, or `horizontal` from explicit layout intent. Emit `gridColumns` only with `layout: grid` and an explicit fixed card column count; otherwise omit it. Use `componentAppearance.cssClasses` only for a proven Cards-container class.
- If emitted, `componentAppearance.gridColumns` must be one of `2`, `3`, `4`, or `5`.
- If full-card and decision-button actions coexist, document interaction precedence and evidence-backed business conditions rather than inferring exclusivity.
- Do not add filtering/search regions or filter orchestration in this Cards template. Route that composition to its owning Faceted Search or Smart Filters pattern.
