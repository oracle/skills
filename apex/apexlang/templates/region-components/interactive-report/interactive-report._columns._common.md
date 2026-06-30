---
templateId: region.interactive-report.columns.common
componentType: region
version: 1.0
description: Shared column contract for interactive report regions.
---

# Purpose

Standardize `column` variable contracts, output shape, and guardrails for all interactive-report variants.

---

# Generation Rules (MANDATORY)

1. Load `interactive-report._common.md` before using this columns contract.
2. Align each column with the SQL projection order and data semantics.
3. Omit optional nested blocks when their variables are not provided.
4. Emit each column as a multiline child block; never collapse `layout { sequence: ... }` onto one line.

---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| column.name | yes | string | Column static identifier. |
| column.type | required | enum | Interactive report column type. `hidden`, `plainText` |
| column.heading | required | string | Heading text shown to users. Required for every Interactive Report column, including `type: hidden`. |
| column.headingAlignment | optional | enum | `start`, `center`, `end`. |
| column.sequence | yes | number | Display order. |
| column.columnAlignment | optional | enum | `start`, `center`, `end`. |
| column.group | optional | string | Optional column group. |
| column.formatMask | optional | string | Numeric/date formatting mask. |
| column.columnFormatting.htmlExpression | optional | string | Column markup rendering expression. |
| column.source.dataType | required | string | Source data type (always UPPER): `DATE`, `NUMBER`, `STRING`, `CLOB`, `OTHER` |
| column.lov.type | optional | enum | LOV type for mapped display text. |
| column.lov.sharedComponent | optional | string | Existing shared LOV alias. |
| column.security.authorizationScheme | optional | string | Existing authorization alias. |
| column.link.target | optional | object | Declarative target object for column-level navigation. Use `#COLUMN_ALIAS#` for current report-row values and `&ITEM.` only for page/app/session substitutions. |
| column.link.linkText | optional | string | Link label/substitution text. |
| column.link.linkAttributes | optional | string | HTML attributes for the rendered link. |
| column.comments | required by default | string | Descriptive metadata string for `comments { comments: ... }` on business-significant, derived, status, and action columns; include the required attributes `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, and `Authorization Scheme`, with optional leading `Summary`. |
| column.genAI.columnContext | optional | string | NL2IR column context from column annotation `column_context`, else `ai_context`, else `description`, else column comment. |
| column.advanced.columnAlias | optional | string | APEX alias for REST/NL2IR scenarios. |

---

# Output Template – Full

```apexlang
column {{column.name}} (
  type: {{column.type}}
  heading {
    heading: {{column.heading}}
    alignment: {{column.headingAlignment}}
  }
  layout {
    sequence: {{column.sequence}}
    columnAlignment: {{column.columnAlignment}}
    group: {{column.group}}
  }
  appearance {
    formatMask: {{column.formatMask}}
  }
  columnFormatting {
    htmlExpression: {{column.columnFormatting.htmlExpression}}
  }
  source {
    dataType: {{column.dataType}}
  }
  lov {
    type: {{column.lov.type}}
    listOfValues: @{{column.lov.sharedComponent}}
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
  comments {
    comments: {{column.comments}}
  }
  genAI {
    columnContext: {{column.genAI.columnContext}}
  }
  advanced {
    columnAlias: {{column.advanced.columnAlias}}
  }
)
```

---

# Conditional Rendering Rules

- Do not emit `reportColumnQueryId` or `derivedColumn` for interactive report columns. These attributes are classic-report-only in this repository contract.
- Do not omit the `heading` block. Hidden technical columns still require `heading { heading: ... }` for compiler-safe output.
- Do not omit the `layout` block or `layout.sequence`; the live compiler requires explicit column ordering.
- Omit `heading.alignment`, `layout.columnAlignment`, and `layout.group` when not provided.
- Omit `appearance` unless `column.formatMask` is provided.
- Omit `columnFormatting` unless `column.columnFormatting.htmlExpression` is provided.
- Omit `source` unless `column.dataType` is provided.
- Omit `lov` unless using LOV-backed rendering.
- Omit `security` when column-level authorization is not required.
- Omit `link` unless column-level navigation is explicitly requested and target page/item mappings are known.
- Omit `comments` only for hidden technical columns or when a documented exemption applies.
- Omit `genAI` unless NL2IR context is required.
- Omit `advanced` unless `column.advanced.colAlias` is provided.

---

# Guardrails

- Keep column definitions synchronized with SQL/REST projection and ordering.
- Keep `layout.sequence` as a multiline nested block on every generated column.
- Every Interactive Report column must emit `heading { heading: ... }`; `type: hidden` does not waive that requirement.
- Interactive report columns must not use classic-report query-position metadata such as `reportColumnQueryId` or `derivedColumn`.
- Interactive Report column links use the column-level `link {}` block while keeping the column `type: plainText`. Never copy Classic Report `type: link` into Interactive Report columns.
- For Interactive Report column-link `target.items`, use `#COLUMN_ALIAS#` for current report-row values and reserve `&ITEM.` for page/app/session substitutions.
- Use only existing LOV and authorization shared component aliases.
- When `comments` is emitted, keep it as a single string literal inside `comments { comments: ... }`.
- Emit `comments { comments: ... }` by default for business-significant, derived, status, and action columns instead of treating the block as opt-in metadata.
- The required attributes are `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, and `Authorization Scheme`.
- Include `Summary` only when a short leading business-intent sentence materially helps maintenance.
- When `Summary` is present, keep the stable order `Summary`, `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, `Authorization Scheme`.
- Mirror executable settings such as `appearance.formatMask` and `security.authorizationScheme` when those blocks are emitted.
- For NL2IR scenarios, `column.genAI.columnContext` must come from column annotation `column_context`, else `ai_context`, else `description`, else column comment.
- When using `columnFormatting.htmlExpression`, do not emit `type: richText`; keep plain text implicit.
- Keep SQL data-only; emit report markup via `columnFormatting.htmlExpression` per `references/policies/memory-bank/30-pages/apex.report-column-rendering.md`.
