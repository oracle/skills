---
templateId: region.cards.rest-source
componentType: region
version: 1.0
imports:
  - cards._common
description: Cards region backed by REST source.
---

# Output Template

```
region {{regionStaticId}} (
  name: {{name}}
  type: cards
  source {
    location: restSource
    restSource: @{{source.restSource}}
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

The `valueProperty` placeholders are schematic. Content blocks emit `advancedFormatting: false` plus `column`, or `advancedFormatting: true` plus `htmlExpression`. Direct-source media emits `advancedFormatting: false`, required `position`, required `sizing`, and exactly one matching pair: `blobColumn` for `source: blobColumn`, `urlColumn` for `source: urlColumn`, or `url` for `source: imageUrl`. Emit `blobAttributes` only with `blobColumn` media. Append the native Cards action shape from `cards._common.md` only when a proven card target is requested; button presentation may use `appearance`, actions may use `advanced` and `serverSideCondition`, and `triggerAction` uses a nested child while omitting navigation targets.

# Conditional Rendering Rules

- Resolve the existing REST Data Source, its REST Data Source Server, Web Credential, and authoritative data profile before rendering. Every title, subtitle, body, secondary-body, identity, icon, media, badge, link, or conditional-style field must use an actual profile column.
- Omit `card.cssClasses` unless conditional per-row styling is explicitly requested. When used, map exactly one authoritative profile column constrained to `u-normal`, `u-hot`, `u-info`, `u-success`, `u-warning`, `u-danger`, or `NULL`; record that exact finite set in the profile column's `comments.comments` as `authoritative-profile-enum: [...]`. A missing enum marker or free-form service field is not safe class evidence.
- For a REST media URL column, record `authoritative-profile-url-prefixes: [...]` in that profile column's `comments.comments`. List exact HTTPS prefixes, or use `application-static-relative` only when the service contract guarantees relative application-static paths.

- If `title.column` is emitted, set `title.advancedFormatting: false` and omit `title.htmlExpression`.
- If `title.htmlExpression` is emitted, `title.advancedFormatting` must also be emitted with value `true`, and `title.column` must be omitted.
- If `subtitle.column` is emitted, set `subtitle.advancedFormatting: false` and omit `subtitle.htmlExpression`.
- If `subtitle.htmlExpression` is emitted, `subtitle.advancedFormatting` must also be emitted with value `true`, and `subtitle.column` must be omitted.
- If `body.column` is emitted, set `body.advancedFormatting: false` and omit `body.htmlExpression`.
- If `body.htmlExpression` is emitted, `body.advancedFormatting` must also be emitted with value `true`, and `body.column` must be omitted.
- If `secondaryBody.column` is emitted, set `secondaryBody.advancedFormatting: false` and omit `secondaryBody.htmlExpression`.
- If `secondaryBody.htmlExpression` is emitted, `secondaryBody.advancedFormatting` must also be emitted with value `true`, and `secondaryBody.column` must be omitted.
- Omit the `media` block unless the cards design explicitly includes images or thumbnails.
- When `media` is emitted, set `advancedFormatting: false`, emit required `position` and `sizing`, and use exactly one matching source/value shape: `blobColumn`/`blobColumn`, `urlColumn`/`urlColumn`, or `imageUrl`/`url`.
- Emit `blobAttributes` only for `media.source: blobColumn` and only with metadata columns present in the REST data profile.
- Inside cards `title.htmlExpression`, `subtitle.htmlExpression`, `body.htmlExpression`, and `secondaryBody.htmlExpression`, use `&COLUMN.` substitution strings, not `#COLUMN#`.
- Emit `componentAppearance.layout: grid`, `float`, or `horizontal` from explicit layout intent. Emit `gridColumns` only with `layout: grid` and an explicit fixed card column count; otherwise omit it. Use `componentAppearance.cssClasses` only for a proven Cards-container class.
- If emitted, `componentAppearance.gridColumns` must be one of `2`, `3`, `4`, or `5`.
- If full-card and decision-button actions coexist, document interaction precedence and evidence-backed business conditions rather than inferring exclusivity.
- When refresh depends on page items accepted by the REST operation, emit those items in `source.pageItemsToSubmit` and target the Cards static ID with the native Refresh dynamic-action capability.
- Do not add filtering/search regions or filter orchestration in this Cards template. Route that composition to its owning Faceted Search or Smart Filters pattern.

# REST Security Gate

- `source.restSource` must be an existing shared REST Data Source alias with an authoritative data profile; never substitute an endpoint URL.
- Keep passwords, tokens, API keys, Authorization headers, and secret query parameters in an APEX Web Credential, never in the Cards artifact.
- Require a declared `restDataSourceServer` with a literal HTTPS `endpointUrl.url`. Require the REST Data Source `authentication.credentials` reference to resolve to a declared `webCredential`, and require its `advanced.validForUrls` to include the exact resolved server plus `source.urlPathPrefix`. Stop with `Missing Inputs` if any link is absent or broader than the required prefix.
- Treat media URL fields as untrusted. The authoritative profile contract must constrain them to documented HTTPS origins or application-static relative paths and reject `javascript:`, `data:`, protocol-relative, embedded-credential, and user-controlled redirect values.
- Apply page authentication, an existing Cards region authorization scheme when required, and independent authorization on navigation targets and server-side operations.
