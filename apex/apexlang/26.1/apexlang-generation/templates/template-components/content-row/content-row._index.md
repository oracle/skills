---
templateId: content-row.index
componentType: templateComponent
imports:
  - content-row.common
version: 1.0
description: Entry point and routing catalog for Content Row template scenarios.
---

## Purpose
Use as the routing index for Content Row templates. Select a scenario based on display mode and required features.

## Default Routing
- Default create-page/create-region prompts with Content Row and no qualifiers should select `content-row.report-minimal.md`.
- Use `report-explicit-defaults` only when pagination or entity-title defaults are specifically requested.
- Avatar scenarios use `settings.displayAvatar` for visibility and `plugin-avatar` for configuration fields such as `type`, `initials`, `description`, `shape`, `size`, and `cssClasses`.
- Badge scenarios use `settings.displayBadge` for visibility and `plugin-badge` for configuration fields such as `label`, `value`, `state`, `icon`, `displayLabel`, `style`, `shape`, `size`, `columnWidth`, and `position`.
- Use avatar, badge, links, primary actions, grouping, and appearance scenario files only when those features are explicitly requested.
- Use `content-row.report-grouping-selection.md` when native Content Row focus-only, single-row, or multiple-row selection is requested; it documents `rowSelection.currentSelectionPageItem` and the same-page hidden item that stores native selected row state.
- Use `content-row.report-master-detail-full-row-link.md` when a Content Row parent list filters or drives child detail regions. Native `rowSelection.currentSelectionPageItem` alone is not sufficient for parent-child context setting.
- Use `content-row._template_options.md`, `../avatar/avatar._template_options.md`, and `../badge/badge._template_options.md` when validating Content Row plugin attribute names or allowed values.
- For SQL-backed Content Row scenarios, keep the SQL unordered and emit the region-level `orderBy {}` block from `content-row._common.md`.

## Scenario Routing
- Minimal partial row: `content-row.partial-minimal.md`
- Rich partial row with avatar/badge/links: `content-row.partial-rich-content.md`
- Minimal report row list: `content-row.report-minimal.md`
- Report defaults + pagination/entity titles: `content-row.report-explicit-defaults.md`
- Avatar + badge emphasis in report mode, including badge icon/position: `content-row.report-avatar-badge.md`
- Link positions (`titleLink`, `avatarLink`, `badgeLink`, `fullRowLink`): `content-row.report-link-positions.md`
- Master-detail parent selection with a same-page hidden item: `content-row.report-master-detail-full-row-link.md`
- Primary actions (`button` + `menu`): `content-row.report-primary-actions-menu.md`
- Native focus/single/multiple row selection + grouping + pagination: `content-row.report-grouping-selection.md`
- Appearance modifiers: `content-row.report-appearance-variants.md`

## Templates
- Shared contract: `@/template-components/content-row/content-row._common.md`
- Canonical executable skeleton: `@/template-components/content-row/content-row._common.md`
- Scenario templates:
  - `@/template-components/content-row/content-row.partial-minimal.md`
  - `@/template-components/content-row/content-row.partial-rich-content.md`
  - `@/template-components/content-row/content-row.report-minimal.md`
  - `@/template-components/content-row/content-row.report-explicit-defaults.md`
  - `@/template-components/content-row/content-row.report-avatar-badge.md`
  - `@/template-components/content-row/content-row.report-link-positions.md`
  - `@/template-components/content-row/content-row.report-master-detail-full-row-link.md`
  - `@/template-components/content-row/content-row.report-primary-actions-menu.md`
  - `@/template-components/content-row/content-row.report-grouping-selection.md`
  - `@/template-components/content-row/content-row.report-appearance-variants.md`
