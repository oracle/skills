---
templateId: timeline.common
componentType: templateComponent
version: 1.0
description: Shared canonical contract for Timeline template-component generation.
---

# Purpose

Define the shared source, appearance, settings, nested-component, and column contract for Timeline regions.

# Generation Rules (MANDATORY)

1. Use `type: themeTemplateComponent/timeline` and `componentAppearance.display: partial` or `report`.
2. Every Timeline region must include `source`, `componentAppearance`, and `settings`.
3. Map the required `settings.userName`, `settings.date`, and `settings.title` values to verified source columns. `settings.description` is optional.
4. Keep explicit child `column (...)` declarations aligned with every projected report source column and its data type.
5. Enable Avatar and Badge rendering only through `settings.displayAvatar` and `settings.displayBadge`; keep each flag synchronized with its nested block.
6. When Avatar is enabled, emit `plugin-avatar.type` and `plugin-avatar.shape`, plus exactly one payload matching `icon`, `image`, or `initials`.
7. Use a dedicated projected initials column, not the full user-name column. URL-column images must use a declared varchar2 column containing only an application-managed static-file URL.
8. When Badge is enabled, emit `plugin-badge.label` and `plugin-badge.value`; optional state, icon, display, style, and shape values must come from the family-local inventories.
9. Do not emit report-level `applyThemeColors`, `style`, grouping, pagination type/count, messages, or actions until a target-build compiler contract proves those structures.
10. Use `timeline._template_options.md` as attribute inventory only. Compiler-backed APEXlang legality remains authoritative.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| source | yes | block | Use a supported source mode with verified mappings. |
| componentAppearance.display | yes | enum | `partial` or `report`. |
| settings.userName | yes | column | Verified user-name column. |
| settings.date | yes | column | Verified event date or date-range column. |
| settings.title | yes | column | Verified event title column. |
| settings.description | optional | column | Verified description column. |
| settings.displayAvatar | optional | boolean | Must agree with `plugin-avatar` presence. |
| settings.displayBadge | optional | boolean | Must agree with `plugin-badge` presence. |
| plugin-avatar | conditional | block | Required only when Avatar display is enabled. |
| plugin-badge | conditional | block | Required only when Badge display is enabled. |
| column | conditional | child component | Required for report projections and every referenced mapping. |

# Authority Boundary

The Universal Theme export includes metadata that the current APEXlang compiler rejects. Follow the Timeline workflow and target-build compiler validation for any structure not shown by the canonical fixtures.
