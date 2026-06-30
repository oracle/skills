---
templateId: region.interactive-report.columns.format-template
componentType: template
version: 1.0
imports:
  - interactive-report._columns._common.md
description: Rules and reference examples for interactive report column formatting.
---

# Purpose

Define consistent formatting rules and reference examples for interactive-report columns.

This file is a reference contract. It is not a scenario output template.

---

# Generation Rules (MANDATORY)

1. Load `interactive-report._columns._common.md` first.
2. Apply only format rules required by the requested output.
3. Prefer readability and accessibility over dense formatting.

---

# Format Rules

- Use `column.formatMask` only when value presentation needs explicit control.
- For numeric/currency values, set both `heading.alignment` and `layout.columnAlignment` to `end`.
- For date/timestamp values, use deterministic format masks.
- For column links, keep the Interactive Report column type as `plainText` and add the column-level `link {}` block; do not emit Classic Report-only `reportColumnQueryId`, `derivedColumn`, or `type: link`.
- When column comments are requested, keep `comments { comments: ... }` concise but structured: require `Display Label`, `Display in Report`, `Display in Form`, `Format Mask`, `Value Required`, `Read Only`, `Primary Display Column`, and `Authorization Scheme`; include `Summary` only when a short leading business-intent sentence materially helps maintenance.
- Keep format choices consistent within a report.
- dataType should always be UPPER CASE

---

# Reference Examples

## Number / Currency

```apexlang
column {{column.name}} (
  type: plainText
  heading {
    heading: {{column.heading}}
    alignment: end
  }
  layout {
    sequence: {{column.sequence}}
    columnAlignment: end
  }
  appearance {
    formatMask: 999G999G999G999G990D00
  }
  source {
    dataType: NUMBER
  }
)
```

## Date

```apexlang
column {{column.name}} (
  type: plainText
  heading {
    heading: {{column.heading}}
  }
  layout {
    sequence: {{column.sequence}}
  }
  appearance {
    formatMask: DD-MON-YYYY
  }
  source {
    dataType: DATE
  }
)
```

## NL2IR Context Column

Context source precedence:
- `column.genAI.columnContext` uses column annotation `column_context` first.
- If `column_context` is missing/null/blank, fall back to annotation `ai_context`.
- If `ai_context` is missing/null/blank, fall back to annotation `description`.
- If all three annotations are missing/null/blank, fall back to the column comment.
- If neither source exists, omit the `genAI` block.

```apexlang
column {{column.name}} (
  type: plainText
  heading {
    heading: {{column.heading}}
  }
  layout {
    sequence: {{column.sequence}}
  }
  source {
    dataType: STRING
  }
  comments {
    comments: {{column.comments}}
  }
  genAI {
    columnContext: {{column.genAI.columnContext}}
  }
)
```

## Column Link

```apexlang
column {{column.name}} (
  type: plainText
  heading {
    heading: {{column.heading}}
  }
  layout {
    sequence: {{column.sequence}}
  }
  source {
    dataType: {{column.source.dataType}}
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

---

# Conditional Rendering Rules

- Omit each example block not relevant to the target data type.
- Keep only one formatting strategy per column unless explicitly required.
