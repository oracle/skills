---
templateId: avatar.report-image-url-column
componentType: templateComponent
imports:
  - avatar._common.md
version: 1.0
description: Standalone report-mode Avatar using an image URL supplied by a source column.
---

# Purpose

Render one Avatar per source row using a projected image URL column.

# Output Template

```apexlang
settings {
    type: image
    image: {
        type: urlColumn
        urlColumn: {{imageUrlColumn}}
    }
    {{descriptionProperty}}
    shape: {{shape}}
    size: {{size}}
    spacing: {{spacing}}
}

column {{imageUrlColumnStaticId}} (
    layout {
        sequence: {{imageUrlColumnSequence}}
    }
    source {
        databaseColumn: {{imageUrlColumn}}
        dataType: varchar2
    }
)

{{descriptionColumnBlock}}
```

# Conditional Rendering Rules

- `imageUrlColumn` is required and must be projected by the region source.
- `imageUrlColumnStaticId` and `descriptionColumnStaticId` must resolve to uppercase snake_case external identifiers.
- In SQL projections, build every URL as `:APP_FILES || 'relative/path'` or `:APEX_FILES || 'relative/path'`. The bind is SQL syntax; do not quote it or replace it with `#...#` or `&...` syntax.
- Do not pass through a raw database URL column. Reject `AUTHENTICATED_URL_PREFIX` because it may be absolute, BLOB endpoints because this scenario has no FILE-item/primary-key evidence contract, path traversal, `javascript:`, `data:`, protocol-relative (`//...`), and absolute external URLs.
- For meaningful images, set `descriptionProperty` to `description: &{{descriptionColumn}}.` and emit the complete `descriptionColumnBlock`; dynamic sources also record `AVATAR_DESCRIPTION_EVIDENCE_SOURCE=schema_doc|live_db|user_asserted` in comments.
- For decorative images, omit both placeholders and emit `AVATAR_PURPOSE_DECORATIVE`; never leave an unused description column in the output.
- Omit `initials` and `icon`.
- Do not convert this scenario into a BLOB image pattern; BLOB support is deferred.
- Add the remaining source projections as explicit child columns using `avatar._common.md`.

# Validation Checklist

- `settings.type` is `image`.
- `settings.image.type` is `urlColumn`.
- `settings.image.urlColumn` names a projected character column.
- The URL and description source columns are declared as `varchar2`.
- Every URL projection branch is statically proven to stay within the application-managed APEX URL contract.
- Meaningful images have a description; decorative images omit it and use the exact decorative-purpose comment marker so Universal Theme renders `alt=""`.
- Every Avatar child declaration identifier is uppercase snake_case.
