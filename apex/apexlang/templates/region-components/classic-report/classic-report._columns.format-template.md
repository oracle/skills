---
templateId: region.classic-report.columns.format-template
componentType: template
version: 1.0
imports:
  - classic-report._columns._common.md
description: Rules and reference examples for classic report column formatting.
---

# Purpose

Define consistent formatting rules and reference examples for classic-report columns.

This file is a reference contract. It is not a scenario output template.

---

# Generation Rules (MANDATORY)

1. Load `classic-report._columns._common.md` first.
2. Apply only format rules required by the requested output.
3. Prefer readability and accessibility over dense formatting.

---

# Format Rules

- Use `column.formatMask` only when value presentation needs explicit control (currency, percentages, dates).
- For numeric/currency values, set both `heading.alignment` and `layout.columnAlignment` to `end`.
- For date/timestamp values, use a deterministic format mask and keep heading concise.
- For percent graph columns, provide both `appearance.backgroundColor` and `appearance.foregroundColor` together.
- For link columns, emit `type: link`, keep `linkText` user-readable, and avoid hardcoded static IDs in targets.
- For Classic Report link targets, use `#COLUMN_ALIAS#` for current report-row values and `&ITEM.` only for page/app/session substitutions.
- Keep format choices consistent within the same report.
- Keep SQL data-only for report sources; use `columnFormatting.htmlExpression` when visual markup is required.
- For `columnFormatting.htmlExpression`, do not emit `type: richText`; keep plain text implicit.

---

# Reference Examples

## Currency / Number

```apexlang
column {{column.name}} (
  reportColumnQueryId: {{column.reportColumnQueryId}}
  derivedColumn: {{column.derivedColumn}}
  heading {
    heading: {{column.heading}}
    alignment: end
  }
  layout {
    sequence: {{column.sequence}}
    columnAlignment: end
  }
  appearance {
    formatMask: FML999G999G999G999G990D00
  }
)
```

## Date

```apexlang
column {{column.name}} (
  reportColumnQueryId: {{column.reportColumnQueryId}}
  derivedColumn: {{column.derivedColumn}}
  heading {
    heading: {{column.heading}}
  }
  layout {
    sequence: {{column.sequence}}
  }
  appearance {
    formatMask: DD-MON-YYYY
  }
)
```

## Percent Graph

```apexlang
column {{column.name}} (
  reportColumnQueryId: {{column.reportColumnQueryId}}
  derivedColumn: {{column.derivedColumn}}
  type: percentGraph
  heading {
    heading: {{column.heading}}
    alignment: end
  }
  layout {
    sequence: {{column.sequence}}
    columnAlignment: end
  }
  appearance {
    backgroundColor: {{column.appearance.backgroundColor}}
    foregroundColor: {{column.appearance.foregroundColor}}
  }
)
```

## Link

```apexlang
column {{column.name}} (
  reportColumnQueryId: {{column.reportColumnQueryId}}
  derivedColumn: {{column.derivedColumn}}
  type: link
  heading {
    heading: {{column.heading}}
  }
  layout {
    sequence: {{column.sequence}}
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
)
```

Concrete example:

```apexlang
column PRODUCT_NAME (
  reportColumnQueryId: 20
  derivedColumn: false
  type: link
  heading {
    heading: Product
  }
  layout {
    sequence: 20
  }
  link {
    target: {
      page: 15
      items: {
        P15_PRODUCT_ID: #PRODUCT_ID#
      }
      clearCache: 15
    }
    linkText: #PRODUCT_NAME#
  }
)
```

## Column Formatting (Badge/Highlight Rendering)

```apexlang
column {{column.name}} (
  reportColumnQueryId: {{column.reportColumnQueryId}}
  derivedColumn: {{column.derivedColumn}}
  heading {
    heading: {{column.heading}}
  }
  layout {
    sequence: {{column.sequence}}
  }
  columnFormatting {
    htmlExpression: {{column.columnFormatting.htmlExpression}}
  }
)
```

SQL pattern note:
- Return raw values/flags in SQL (for example `CLAIM_STATUS`, `HIGH_VALUE_FLAG`) and apply markup in `columnFormatting.htmlExpression`.

---

# Conditional Rendering Rules

- Omit each example block not relevant to the requested data type.
- Keep only one formatting strategy per column unless explicitly requested.
