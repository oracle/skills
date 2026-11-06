---
templateId: avatar.report-initials
componentType: templateComponent
imports:
  - avatar._common.md
version: 1.0
description: Standalone report-mode Avatar using initials from a varchar2 source column.
---

# Purpose

Render one Avatar per source row using character initials.

# Output Template

```apexlang
settings {
    type: initials
    initials: {{initialsColumn}}
    {{descriptionProperty}}
    shape: {{shape}}
    size: {{size}}
    spacing: {{spacing}}
}

column {{initialsColumnStaticId}} (
    layout {
        sequence: {{initialsColumnSequence}}
    }
    source {
        databaseColumn: {{initialsColumn}}
        dataType: varchar2
    }
)

{{descriptionColumnBlock}}
```

# Conditional Rendering Rules

- `initialsColumn` is required and must resolve to a projected `varchar2` column; emit the direct column identifier without `&` or a trailing period.
- `initialsColumnStaticId` and `descriptionColumnStaticId` must resolve to uppercase snake_case external identifiers.
- For meaningful initials, set `descriptionProperty` to `description: &{{descriptionColumn}}.` and emit the complete `descriptionColumnBlock`; dynamic sources also record `AVATAR_DESCRIPTION_EVIDENCE_SOURCE=schema_doc|live_db|user_asserted` in comments.
- For decorative initials, omit both placeholders and emit `AVATAR_PURPOSE_DECORATIVE`; never leave an unused description column in the output.
- Omit `icon` and `image`.
- Add the remaining source projections as explicit child columns using `avatar._common.md`.

# Validation Checklist

- `settings.type` is `initials`.
- `settings.initials` uses the direct uppercase source-column identifier because the compiler metadata defines it as a `sessionStateValue` column selector.
- The initials source column is named and declares `source.databaseColumn` plus `source.dataType: varchar2`.
- Meaningful initials have a description; decorative initials omit it and use the exact marker so Universal Theme renders `aria-hidden="true"`.
- Every Avatar child declaration identifier is uppercase snake_case.
