---
templateId: comments.common
componentType: templateComponent
version: 1.0
description: Shared canonical contract for Comments template-component generation.
---

# Purpose

Define the shared source, appearance, settings, nested-Avatar, optional report behavior, and column contract for Comments regions.

# Generation Rules (MANDATORY)

1. Use `type: themeTemplateComponent/comments` and `componentAppearance.display: partial` or `report`.
2. Every Comments region must include `source`, `componentAppearance`, and `settings`.
3. Map required `settings.userName` and `settings.commentText`, plus optional `settings.date`, directly to declared uppercase child-column identifiers. In report mode, use an accepted enum for required `settings.style`; omit `settings.style` in partial mode. `attributes`, `commentClass`, `alignment`, and `applyThemeColors` are optional.
4. Keep explicit child `column (...)` declarations aligned with every projected report source column and its data type.
5. Enable Avatar rendering only through `settings.displayAvatar`; keep the flag synchronized with `plugin-avatar` presence.
6. When Avatar is enabled, emit `plugin-avatar.type` and `plugin-avatar.shape`, plus exactly one payload matching `icon`, `image`, or `initials`.
7. Use a dedicated projected initials column, not the full user-name column. Do not treat the inventory's `sampleDataValue: INITIALS` as proof that `sampleData: tasks` exposes an `INITIALS` column; target-build runtime evidence rejects that identifier. For Tasks-backed initials, use a verified SQL projection such as `AVATAR_INITIALS` or omit the initials branch. URL-column images must use a declared varchar2 column containing only an application-managed static-file URL.
8. Partial-mode Comments must use a source proven to return at most one row. For SQL sources, include an explicit `fetch first 1 row only` or equivalent `rownum` bound. Partial mode must omit `settings.style` and must not emit the report-only `rowSelection`, `performance`, `pagination`, `entityTitle`, `messages`, or `advanced` blocks. Report-mode Comments requires `settings.style` and may use those compiler-confirmed blocks. Omit `rowSelection` for the no-selection behavior; when selection is requested, use `focusOnly`, `singleSelection`, or `multipleSelection`.
9. Comments supports compiler-proven actions at `actions`, `avatarLink`, and `userNameLink`. Use root `position`, `label` only for `actions`, a numeric `layout.sequence`, and a structured `behavior.target`; omit the stale `template` and `behavior.type` properties. A separate standalone Badge region is not a badge on each Comments row.
10. Do not emit nested `plugin-badge` or `plugin-grouping` blocks. A direct APEX 26.1 probe rejects `plugin-grouping.groupTitle` and `plugin-grouping.groupIcon` as invalid application-source properties, so grouping is explicitly unsupported for generated APEXlang. A separate standalone Badge region is not a badge on each Comments row.
11. Keep `settings.attributes` free of scriptable markup and event handlers. Keep `settings.commentClass` to static CSS tokens or a declared varchar2 source-column mapping; do not emit substitution-driven classes.
12. Use `comments._template_options.md` as attribute inventory only. Compiler-backed APEXlang legality remains authoritative.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| source | yes | block | Use a supported source mode with verified mappings. |
| componentAppearance.display | yes | enum | `partial` or `report`. |
| settings.userName | yes | column | Verified user-name column. |
| settings.commentText | yes | column | Verified comment-text column. |
| settings.style | report only | enum | Required for `report`; omit for `partial`. Values: `basic` or `chatSpeechBubbles`. |
| settings.date | optional | column | Verified date or timestamp column. |
| settings.displayAvatar | optional | boolean | Must agree with `plugin-avatar` presence. |
| plugin-avatar | conditional | block | Required only when Avatar display is enabled. |
| column | conditional | child component | Required for report projections and every referenced mapping. |

# Authority Boundary

The Universal Theme export includes grouping and action metadata that the current APEXlang compiler rejects. Follow the Comments workflow and target-build compiler validation for any structure not shown by the canonical fixtures.
