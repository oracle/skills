---
templateId: avatar.report-icon
componentType: templateComponent
imports:
  - avatar._common.md
version: 1.0
description: Standalone report-mode Avatar using a Font APEX icon.
---

# Purpose

Render one Avatar per source row using an approved Font APEX icon value.

# Output Template

```apexlang
settings {
    type: icon
    icon: {{iconValue}}
    {{descriptionProperty}}
    shape: {{shape}}
    size: {{size}}
    spacing: {{spacing}}
}

{{iconColumnBlock}}

{{descriptionColumnBlock}}
```

# Conditional Rendering Rules

- The icon value must contain exactly one icon from `assets/indexes/font-apex-icon-index.json` and only optional modifiers listed there.
- For literal mode, set `iconValue` to one allowlisted literal and omit `iconColumnBlock`.
- For column mode, set `iconValue` to `&{{iconColumn}}.` and emit the complete `iconColumnBlock`; the source must project approved literals directly or use an explicit SQL `case` mapping whose every result satisfies that canonical contract. Raw dynamic columns, unknown icons or modifiers, multiple icons, and arbitrary classes are forbidden.
- `iconColumnStaticId` and `descriptionColumnStaticId` must resolve to uppercase snake_case external identifiers.
- For meaningful icons, set `descriptionProperty` to `description: &{{descriptionColumn}}.` and emit the complete `descriptionColumnBlock`; dynamic sources also record `AVATAR_DESCRIPTION_EVIDENCE_SOURCE=schema_doc|live_db|user_asserted` in comments.
- For decorative icons, omit both description placeholders and emit `AVATAR_PURPOSE_DECORATIVE`; never leave an unused description column in the output.
- Omit `initials` and `image`.
- Add the remaining source projections as explicit child columns using `avatar._common.md`.

# Validation Checklist

- `settings.type` is `icon`.
- `settings.icon` is one allowlisted literal or an `&COLUMN_NAME.` substitution whose source projection is a fully verified allowlisted mapping.
- The icon and description source columns are declared as `varchar2` when column-backed.
- Meaningful icons have a description; decorative icons omit it and use the exact marker so Universal Theme renders `aria-hidden="true"`.
- Every Avatar child declaration identifier is uppercase snake_case.
