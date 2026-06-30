---
templateId: region.classic-report.columns.common
componentType: region
version: 1.0
description: Shared column contract for classic report regions.
---

# Purpose

Standardize `column` variable contracts, output shape, and guardrails for all classic-report variants.

---

# Generation Rules (MANDATORY)

1. Load `classic-report._common.md` before using this columns contract.
2. Align each column with the SQL projection order and data semantics.
3. Omit optional nested blocks when their variables are not provided.
4. Emit each column as a multiline child block; never collapse `layout { sequence: ... }` onto one line.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| column.name | yes | string | Column static identifier. |
| column.reportColumnQueryId | yes | number | Must map to SQL projection position. |
| column.derivedColumn | yes | enum | Usually `N` unless derived. |
| column.type | optional | enum | `plainText`, `plainTextBasedOnLov`, `richText`, `link`, `image`, `downloadBlob`, `hidden`, `percentGraph`. Required as `link` when a column-level `link {}` block is emitted. |
| column.heading | optional | string | Heading text shown to users. Omit it entirely when `column.type: hidden`. |
| column.headingAlignment | optional | enum | `start`, `center`, `end`. |
| column.sequence | yes | number | Display order. |
| column.columnAlignment | optional | enum | `start`, `center`, `end`. |
| column.formatMask | optional | string | Numeric/date formatting mask. |
| column.columnFormatting.htmlExpression | optional | string | Column-level HTML rendering expression for presentation formatting. |
| column.settings.format | optional | enum | Optional text formatting metadata when a non-default column type requires it. |
| column.comments | required by default | string | Descriptive metadata string for `comments { comments: ... }` on business-significant, derived, status, and action columns; include the required attributes `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, and `Authorization Scheme`, with optional leading `Summary`. |
| column.security.authorizationScheme | optional | string | Existing authorization alias. |
| column.link.target | optional | object or string | For same-application links, use a declarative target object with `page`, `items`, and `clearCache`. In `target.items`, use `#COLUMN_ALIAS#` for current report-row values and `&ITEM.` only for page/app/session substitutions. Use string URLs only for explicit URL mode or component families that require URL strings. |
| column.link.linkText | optional | string | Link label/substitution text. |
| column.link.linkAttributes | optional | string | HTML attributes for rendered link. |
| column.lov.type | optional | enum | LOV type for `plainTextBasedOnLov`. |
| column.lov.sharedComponent | optional | string | Existing shared LOV alias. |
| column.appearance.backgroundColor | optional | color | Percent graph background color. |
| column.appearance.foregroundColor | optional | color | Percent graph foreground color. |
| column.sorting.defaultSequence | optional | number | Default sort order for classic report column. |

---

# Output Template – Full

```apexlang
column {{column.name}} (
  reportColumnQueryId: {{column.reportColumnQueryId}}
  derivedColumn: {{column.derivedColumn}}
  type: {{column.type}}
  heading {
    heading: {{column.heading}}
    alignment: {{column.headingAlignment}}
  }
  layout {
    sequence: {{column.sequence}}
    columnAlignment: {{column.columnAlignment}}
  }
  appearance {
    formatMask: {{column.formatMask}}
    backgroundColor: {{column.appearance.backgroundColor}}
    foregroundColor: {{column.appearance.foregroundColor}}
  }
  columnFormatting {
    htmlExpression: {{column.columnFormatting.htmlExpression}}
  }
  settings {
    format: {{column.settings.format}}
  }
  comments {
    comments: {{column.comments}}
  }
  security {
    authorizationScheme: @{{column.security.authorizationScheme}}
  }
  link {
    target: {
      page: {{column.link.target.page}}
      items: {
        {{column.link.target.items}}
      }
      clearCache: {{column.link.target.clearCache}}
    }
    linkText: {{column.link.linkText}}
    linkAttributes: {{column.link.linkAttributes}}
  }
  lov {
    type: {{column.lov.type}}
    lov: @{{column.lov.sharedComponent}}
  }

Example report-row item mapping:

```apexlang
  link {
    target: {
      page: 15
      items: {
        P15_PRODUCT_ID: #PRODUCT_ID#
        P15_MODE: &P1_MODE.
      }
      clearCache: 15
    }
    linkText: View
  }
```
  sorting {
    defaultSequence: {{column.sorting.defaultSequence}}
  }
)
```

---

# Conditional Rendering Rules

- Omit `type` when default rendering is sufficient.
- Do not omit `type: link` when a Classic Report column emits a column-level `link {}` block.
- Omit `heading.alignment` and `layout.columnAlignment` when alignment is not specified.
- Do not omit the `layout` block or `layout.sequence`; the live compiler requires explicit column ordering.
- Omit `appearance` unless one or more of `formatMask`, `backgroundColor`, `foregroundColor` is provided.
- Omit `columnFormatting` when no HTML rendering expression is required.
- Omit `settings` unless `column.settings.format` is provided.
- Do not emit a `source` block for classic-report columns in this runtime; keep source metadata in the region SQL and the column contract blocks above.
- Omit `comments` only for hidden technical columns or when a documented exemption applies.
- Omit `security` when column-level authorization is not required.
- Omit `link` unless column type is `link` or link behavior is explicitly requested.
- For same-application column links, render `link.target` as a declarative object. Do not use scalar `f?p=...` or SQL-generated `apex_page.get_url(...)` unless URL mode is explicitly selected.
- Omit `lov` unless using `plainTextBasedOnLov`.
- Omit `sorting` unless default sorting is explicitly requested.
- Omit `heading` when the `type` is `hidden`.
- For visible Classic Report columns, keep explicit headings and make the PK decision explicit: declarative navigation when row navigation is intended, otherwise hidden technical PK handling.

---

# Guardrails

- `column.reportColumnQueryId` must remain synchronized with SQL projection order.
- Keep `layout.sequence` as a multiline nested block on every generated column.
- Keep `column.type` compatible with classic-report supported types.
- When a Classic Report column contains `link {}`, emit top-level `type: link`; a link block without the matching column type is invalid generated output.
- Do not emit `source { databaseColumn: ... dataType: ... }` on classic-report columns in this runtime; that shape belongs to other column families such as interactive grid or template-driven columns.
- Hidden Classic Report columns must not emit `heading {}`; keep this rule separate from Interactive Report, where hidden columns still require headings.
- Use only existing authorization schemes and LOV aliases.
- When `comments` is emitted, keep it as a single string literal inside `comments { comments: ... }`.
- Emit `comments { comments: ... }` by default for business-significant, derived, status, and action columns instead of treating the block as opt-in metadata.
- The required attributes are `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, and `Authorization Scheme`.
- Include `Summary` only when a short leading business-intent sentence materially helps maintenance.
- When `Summary` is present, keep the stable order `Summary`, `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, `Authorization Scheme`.
- Mirror executable settings such as `appearance.formatMask` and `security.authorizationScheme` when those blocks are emitted.
- When using `columnFormatting.htmlExpression`, do not emit `type: richText`.
- For `columnFormatting.htmlExpression`, leave plain text type implicit unless a non-default type is required.
- Keep report SQL data-only; emit presentation markup only through `columnFormatting.htmlExpression` per `references/policies/memory-bank/30-pages/apex.report-column-rendering.md`.
