---
templateId: content-row.report-link-positions
componentType: templateComponent
imports:
  - content-row.common
version: 1.0
description: Report-mode Content Row link-position coverage.
---

# Purpose
Cover all link positions in report mode: `avatarLink`, `titleLink`, `badgeLink`, `fullRowLink`.

# Output Template
```apx
region {{regionStaticId}} (
    type: themeTemplateComponent/contentRow
    componentAppearance { display: report }
    action {{avatarActionId}} ( position: avatarLink )
    action {{titleActionId}} ( position: titleLink )
    action {{badgeActionId}} ( position: badgeLink )
    action {{rowActionId}} ( position: fullRowLink )
)
```

# Conditional Rendering Rules
- Each link action uses exactly one supported link position.
- Avoid redundant navigation affordances unless requested.

# Validation Checklist
- Behavior blocks use explicit redirect type and `targetUrl`.
- Link actions are sequenced deterministically.
