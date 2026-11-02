# Metric Card Templates

## Purpose
Canonical Metric Card template pack for `themeTemplateComponent/metricCard`, using MD-first scenario templates with one canonical APX skeleton.

## Usage
- Load `metric-card._common.md` first for variable contract and generation guardrails.
- Use `metric-card._index.md` to confirm the routing entrypoint and load order.
- Metric Card regions emit `type: themeTemplateComponent/metricCard` with `componentAppearance.display: partial` or `report`.
- Metric Card regions should always emit a region `appearance {}` block.
- Dashboard KPI strips default to `template: @/blank-with-attributes` so the Metric Card has no visible standard region chrome.
- Use `template: @/standard` only when the design explicitly needs a titled or landmarked visible region wrapper.
- Emit `advanced { htmlDomId: ... }` only when external page logic must target a known region DOM id; native runtime behavior does not require it.
- Column source mappings use the compiler-resolved `column-f` child production.
- Metric Card child columns support the documented `column.source.dataType` inventory in `metric-card._common.md`; emit those tokens exactly.
- Report-mode Metric Card requires explicit child `column (...)` metadata for every delivered source projection. Do not satisfy the compiler minimum by adding only one column when the source projects more than one field.
- Every emitted child column declares `source.databaseColumn` and `source.dataType`; emit `primaryKey: true` only for an identity column when row identity is needed.
- Metric Card `settings` expose more than `title` and `metric`; use `meta`, the CSS-class hooks, and layout/item CSS properties from `metric-card._template_options.md` when the design needs them.
- `layout` and `itemCssClasses` are report-only. Partial mode also omits grouping, row selection, messages, and pagination.
- Metric Card `settings.metric` is required. Query-column-backed `title`, `metric`, and `meta` values use `&COLUMN_NAME.` substitution syntax.
- Metric Card may also use `plugin-avatar`, `plugin-badge`, and `rowSelection` in accepted scenarios. Do not force those property names to mirror child-column names; they are value hooks, not a second column declaration system.
- For Metric Card avatar rendering, use `plugin-avatar.displayAvatar` plus the typed avatar payload inside `plugin-avatar`.
- Metric Card owns its nested avatar position/alignment/style/shape/size values; do not substitute the standalone Avatar region settings inventory.
- Avatar `style: subtle` is accepted only for icon and initials types; image avatars omit style.
- Do not emit `settings.displayAvatar` for Metric Card; use `plugin-avatar.displayAvatar` instead.
- For Metric Card badge rendering, use `plugin-badge.displayBadge` plus badge fields inside `plugin-badge`.
- When a Metric Card Badge is emitted, include both `label` and `value`; source-backed selector attributes use bare projected aliases and optional states follow the Badge allowlist.
- Do not emit `settings.displayBadge` for Metric Card; use `plugin-badge.displayBadge` instead.
- Metric Card `rowSelection` can also be focus-only. Use `focusOnly` with no page-item bindings, `singleSelection` with `currentSelectionPageItem`, or `multipleSelection` with both `currentSelectionPageItem` and `selectAllPageItem`.
- Report mode supports no-data messages and `pagination.entitiesPerPage`; do not emit pagination `type` or `showTotalCount`.
- When Metric Card uses any `rowSelection` mode, one child column must carry `source.primaryKey: true`.
- Metric Card exposes one row-level action position, `link`. Use a declarative target and do not emit an action template because the component defines no action templates.
- Keep the region authenticated through the page baseline. Add region/action authorization only when a stricter existing authorization scheme is required; never invent an authorization alias.
- A single Metric Card region can render multiple cards from multiple source rows.
- When one region must show several independent metrics, prefer a normalized multi-row SQL source. The default pattern is `UNION ALL` across one SELECT per metric so every row projects the same aliases in the same order.
- Load `metric-card._template_options.md` for Metric Card-specific layout and grouping values.
- Load `metric-card.report-avatar-badge.md` for nested Avatar/Badge permutations and `metric-card._template_options.md` for their Metric Card-specific values.
- Load `metric-card.permutations.md` when generating a QA application that must cover every APEX 26.1 Metric Card branch and enum.

## Template Catalog
- `metric-card._common.md`
- `metric-card._index.md`
- `metric-card._template_options.md`
- `metric-card.partial-minimal.md`
- `metric-card.report-minimal.md`
- `metric-card.report-avatar-badge.md`
- `metric-card.report-link.md`
- `metric-card.report-grouping-selection.md`
- `metric-card.permutations.md`

## Maintenance
- Keep this README synchronized with actual files in this directory.
- New or updated scenario docs should include: `# Purpose`, `# Output Template`, `# Conditional Rendering Rules`, `# Validation Checklist`.
