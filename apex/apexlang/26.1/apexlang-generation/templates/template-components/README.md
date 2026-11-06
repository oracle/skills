# Template Components Templates

## Purpose
Catalog of canonical markdown-first template-component families and their routing entrypoints.

## Usage
- Load the primary markdown contract or index in the relevant family directory before selecting scenario details.
- Choose a scenario variant matching the requested display mode, interaction pattern, and composition context.
- Use the dedicated owner `*_template_options.md` file when the request changes helper/template-component plugin attributes or settings.
- When a row includes `values=`, pass the left-hand side of each `name=>return_value` pair, not the emitted CSS or return token.
- Use `template-components.registry.json` for tooling discovery and preserve markdown-first conventions when updating workflow or registry links.
- For report-type template components, emit one compiler-appropriate child column for every delivered source projection. Resolve the active target-build grammar before choosing a child-column variant. Media List must use the single column declaration and property shape selected by that contract; do not hardcode a compiler component type across builds.
- This default applies to Content Row, Metric Card, Media List, and Comments, while the target-build contract still determines each family's exact column declaration.
- Do not mix template-component column variants or satisfy projection coverage with one placeholder child column.
- For any template component that emits `rowSelection` with a non-null mode, mark one child column as the identity column with `source.primaryKey: true`.
- For Metric Card, query-backed title, metric, and meta text uses `&COLUMN.` substitution.
- Metric Card's nested Avatar/Badge groups use the Metric Card inventory; selector attributes use bare projected aliases and do not reuse standalone Avatar/Badge region settings.
- Metric Card row navigation uses only the compiler-backed `link` action position and no action template.
- Metric Card supports `partial` and `report`; partial mode omits report-only layout/item classes, grouping, row selection, messages, and pagination, while report pagination exposes only `entitiesPerPage`.

## Template Catalog
- `actions/`
- `avatar/`
- `button/`
- `content-row/`
- `metric-card/`
- `badge/`
- `comments/`
- `flexbox-container/`
- `media-list/`
- `timeline/`
- `avatar/avatar._template_options.md`
  - Owns standalone Avatar settings and shared Avatar value inventories used by other components
- `badge/badge._template_options.md`
- `comments/comments._template_options.md`
- `flexbox-container/flexbox-container._template_options.md`
- `media-list/media-list._template_options.md`
- `timeline/timeline._template_options.md`
- `template-components.registry.json`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever template families are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.

## Template Option Ownership

These inventories come from `create_plugin_attribute` and `create_plugin_attr_value`, not from `wwv_flow_template_options`.

- `actions/actions._template_options.md`
  - Owns `actions`
- `button/button._template_options.md`
  - Owns `button`
- `content-row/content-row._template_options.md`
  - Owns `contentRow`
- `metric-card/metric-card._template_options.md`
  - Owns `metricCard`
- `avatar/avatar._template_options.md`
  - Owns shared `avatar` settings used by multiple template components
- `badge/badge._template_options.md`
  - Owns shared `badge` settings used by the standalone Badge family and other template components
- `comments/comments._template_options.md`
  - Owns `comments`
- `flexbox-container/flexbox-container._template_options.md`
  - Owns `flexboxContainer`
- `media-list/media-list._template_options.md`
  - Owns `mediaList`
- `timeline/timeline._template_options.md`
  - Owns `timeline`
