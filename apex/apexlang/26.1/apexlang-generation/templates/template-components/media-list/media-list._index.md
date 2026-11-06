---
templateId: region.media-list.index
componentType: region
version: 2.0
imports:
  - media-list._common.md
description: Routing entrypoint for complete standalone Media List partial and report generation.
---

# Purpose

Select the narrowest composite-contract Media List scenario without confusing the native template component with a shared-list region using `listTemplate: @/media-list`.

`create a Media List template` selects this direct component, including case and hyphen variations. Explicit List-region or Classic Report wording selects that host owner instead. Generic `list template` wording without the Media List alias selects the shared-list region.

# Load Order

1. Load `media-list._common.md`.
2. Load exactly one primary scenario.
3. Add `media-list.report-avatar-badge.md` only when Avatar or Badge content is requested.
4. Add `media-list.report-link.md` or `media-list.report-layouts.md` only for the corresponding explicit feature.
5. Add `media-list.report-grouped.md` only after the selected curated component policy proves grouping support.
6. Load the owning option inventories only for emitted attributes.

# Scenario Routing

- One non-report item: `media-list.partial.md`
- Base multi-row report: `media-list.report-base.md`
- Avatar and/or Badge rows: `media-list.report-avatar-badge.md`
- Row navigation or verified trigger interaction: `media-list.report-link.md`
- Native report grouping: `media-list.report-grouped.md`, only after its capability gate passes
- Multi-column, horizontal, large, or theme-color variants: `media-list.report-layouts.md`

# Composition Routing

- Combine feature scenario fragments only with the shared block order in `media-list._common.md`.
- Avatar visibility belongs in `settings.displayAvatar`; Avatar configuration belongs in `plugin-avatar`.
- Badge visibility belongs in `settings.displayBadge`; Badge configuration belongs in `plugin-badge`.
- Media List layout, size, and `applyThemeColors` belong in `settings` and are report-only.

# Unsupported Routing

- Do not route custom HTML rendering, custom CSS structure, arbitrary external URLs, multiple actions, action templates, row selection, pagination, or BLOB Avatar images to this pack.
- Do not emit report grouping or nested properties merely because theme metadata advertises them; require the selected curated component policy. Require the active target-build grammar contract only for the report-column variant.
- Use the exact Media List column declaration selected for the active target. Never mix named `source.databaseColumn` columns with unnamed `columnName`/`show` columns.
- Route shared-list navigation to `region-components/list`, not this standalone data-backed component.

# Authorization Routing

When the owning page restricts visibility, require the exact existing shared authorization scheme. A navigable target must enforce the same or stricter access independently. Stop with Missing Inputs rather than guessing either contract.
