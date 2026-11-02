# Media List Templates

## Purpose

Canonical generation pack for the Universal Theme `themeTemplateComponent/mediaList` component in partial and report modes.

Natural requests such as `create a Media List template` select this direct component. Generic `create a list template` requests select the shared-list region. Explicit `List-region Media List template` or `Classic Report Media List template` requests retain their named host owner; adding the word `template` alone does not select a different owner. See `media-list._index.md` for scenario selection.

## Supported Surface

- Partial mode for one Media List item backed by literals or existing session-state values.
- Report mode for verified `localDatabase/sqlQuery` sources only. Unsupported REST, JSON, property-graph, function-body, and sample-data requests stop with Missing Inputs until an adapter exists.
- Required title plus optional description.
- Optional Avatar using the shared initials, Font APEX icon, or application-managed URL-column image contracts.
- Optional Badge using a static label, source-backed value, optional semantic state, and optional Font APEX icon.
- One optional `link` action using a reviewed same-application target.
- Native `2ColumnGrid`, `3ColumnGrid`, `4ColumnGrid`, `5ColumnGrid`, and `horizontalSpan` layouts, optional `large` sizing, and Universal Theme colors.
- Deterministic top-level ordering, exact report projection coverage, region/action authorization, and native responsive behavior.
- Native grouping is not supported by the current curated Media List policy. Enable it only after an authoritative policy refresh exposes a report-group block and exact accepted properties.

## Report-Column Target-Build Gate and Curated Feature Policy

Media List uses a composite contract with an explicit authority boundary:

- The active compiler/grammar metadata resolves only the report-column declaration, required properties, blocks, and datatypes.
- The curated Universal Theme component policy governs Media List settings, `plugin-avatar`, `plugin-badge`, actions, and grouping. These capabilities are not inferred from the report-column grammar.
- Generated `component-contracts/<build>.json` records this boundary in `capability_provenance` so consumers can distinguish `compiler-runtime-metadata` from `curated-component-policy`.

Before generating a report:

1. Load the active `component-contracts/<build>.json` produced by runtime preflight/validation.
2. Resolve `region.column` with the task-scoped grammar contract under `region.type=themeTemplateComponent/mediaList` and a concrete non-null report-source location such as `region.source.location=localDatabase`.
3. Emit exactly the declaration and properties selected by that contract. Named and unnamed column variants are mutually exclusive.
4. Emit settings, Avatar/Badge properties, actions, and grouping only when the selected curated policy exposes their exact names and values.
5. Treat an optional policy capability that is absent as unsupported. Compiler column resolution alone cannot enable it.
6. Stop with Missing Inputs when the report-column contract is unavailable or ambiguous, or when the applicable curated policy cannot be identified.
7. Run the grammar/compiler conformance probe for the selected target build. A compiler default is not optionality: emit `source.type: databaseColumn` when the selected column contract marks it required, even when the compiler also records the `DB_COLUMN` default. Any real grammar-versus-requiredness mismatch blocks generation.

For nested placement, resolve an existing parent region's exact template and slot from the target catalog. Standard and Content Block parents support `regionBody` and `subRegions`; use `regionBody` by default. Page-level placement remains `body`.

Pass the generated contract to local validation with `--component-attributes component-contracts/<build>.json`; do not relabel the repository fallback schema as a target-build contract.

The repository baseline was live-validated with named report columns. That result is evidence for that target, not a universal rule:

```apexlang
column MEDIA_TITLE (
    layout {
        sequence: 20
    }
    source {
        type: databaseColumn
        databaseColumn: MEDIA_TITLE
        dataType: varchar2
    }
)
```

For a target that selects this named variant, the declaration identifier and `source.databaseColumn` must match the exact projected alias, and `source.primaryKey: true` is allowed only when exposed by the active contract. If another target selects an unnamed variant, use its required direct properties instead. Never mix variants.

## Usage

1. Load the active target-build report-column contract and the selected curated Media List component policy.
2. Load `media-list._common.md`.
3. Load `media-list._index.md`.
4. Select the narrowest scenario matching the requested mode and feature set.
5. Load `media-list._template_options.md` for Media List settings.
6. Load `../avatar/avatar._template_options.md` or `../badge/badge._template_options.md` only when that nested feature is enabled.

## Scenario Catalog

- `media-list.partial.md`
- `media-list.report-base.md`
- `media-list.report-avatar-badge.md`
- `media-list.report-link.md`
- `media-list.report-grouped.md` (capability-gated)
- `media-list.report-layouts.md`

## Design-System and Accessibility Rules

- Use native Universal Theme rendering, layouts, shapes, sizes, states, and colors. Do not recreate Media List with Classic Report HTML or custom CSS.
- Keep the native region heading unless the owning page contract intentionally uses a hidden-heading template option with the correct landmark behavior.
- Meaningful Avatars require an accessible description; decorative Avatars use the shared `AVATAR_PURPOSE_DECORATIVE` marker and omit the description.
- Badge color is supplemental. Its value and optional displayed label must communicate meaning without relying on state color alone.
- Native link actions remain keyboard accessible. Do not add `linkAttributes`, inline handlers, or custom focus behavior.
- Prefer the default single-column flow in narrow containers. Select multi-column layouts only when the owning page provides sufficient width; reserve `horizontalSpan` for an explicitly wide, non-wrapping presentation.

## Edge-Case Rules

- Zero-row sources remain zero rows; do not manufacture placeholder SQL rows. Route an explicit empty-state requirement to a separately supported page/region pattern.
- Null descriptions are supported by omitting the description mapping when the entire scenario does not need it. Do not create row-dependent DSL structure.
- Long titles and descriptions rely on Universal Theme wrapping. Do not truncate semantically important content with custom CSS.
- Omit Avatar, Badge, grouping, layout, size, colors, and actions when they were not requested or the selected curated policy does not expose them.
- Keep exactly one action. If multiple interactions are required, route to a component family that exposes the required action positions.
- Stop with Missing Inputs when a source, column, destination, authorization scheme, icon, state mapping, or dynamic accessible description cannot be proven.

## Maintenance

- Keep this README, `media-list._index.md`, `media-list._template_options.md`, and `../template-components.registry.json` synchronized.
- Keep the curated component policy and theme-export option inventory aligned with `query-valid-props.mjs --template-component mediaList`. Keep only report-column structural decisions aligned with the active task-scoped `region.column` grammar contract.
- Update validator rules and regression coverage whenever the supported Media List surface changes.
