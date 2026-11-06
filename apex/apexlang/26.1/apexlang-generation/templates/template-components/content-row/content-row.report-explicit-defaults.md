---
templateId: content-row.report-explicit-defaults
componentType: templateComponent
imports:
  - content-row.common
version: 1.0
description: Report-mode Content Row example with explicit defaults and pagination/entity titles.
---

# Purpose
Document explicit default blocks in report mode, including pagination and entity titles.

# Output Template
```apx
region {{regionStaticId}} (
    type: themeTemplateComponent/contentRow
    componentAppearance { display: report }
    pagination { type: page entitiesPerPage: {{pagination.entitiesPerPage}} }
    entityTitle { singular: {{entityTitle.singular}} plural: {{entityTitle.plural}} }
)
```

# Conditional Rendering Rules
- Include pagination only in report mode.
- Keep entity title singular/plural aligned with row entity semantics.

# Validation Checklist
- Pagination settings are valid for page-level listing.
- Entity titles are present and consistent.
