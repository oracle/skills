---
templateId: region.media-list.common
componentType: region
version: 2.0
description: Composite compiler-column and curated-policy contract for standalone Media List partial and report regions.
---

# Purpose

Define `themeTemplateComponent/mediaList` using target-build-resolved report columns plus curated Universal Theme policy for settings, nested Avatar/Badge composition, interactions, grouping, responsive layouts, accessibility, security, and edge-case behavior.

# Compiler and Theme Evidence

- The Universal Theme export supplies an option inventory; it is not structural compiler evidence.
- The export inventory supports `partial` and `report`, one `link` action position, and no action templates.
- Resolve the active target build's task-scoped grammar contract before choosing report-column syntax.
- Settings, Avatar/Badge properties, actions, and grouping come from the curated Media List component policy, not from compiler report-column grammar. The generated contract identifies each authority in `capability_provenance`.
- The current compiler target resolves named report columns, while the current curated policy exposes no grouping/nested-size surface. A compiler change alone does not enable policy-owned features.
- Media List settings and values: `media-list._template_options.md`.
- Nested Avatar and Badge settings: `../avatar/avatar._template_options.md` and `../badge/badge._template_options.md`.

# Capability Resolution Gate (MANDATORY)

1. Load `component-contracts/<build>.json` for the selected runtime target. Use repository `assets/component-attributes.json` only as the documented fallback for its recorded build.
2. Resolve `region.column` under `region.type=themeTemplateComponent/mediaList` and the report's concrete non-null `region.source.location` through the task-scoped grammar contract.
3. Select exactly one resolved column variant. A named variant uses its declaration identifier and accepted source properties; an unnamed variant uses only its accepted direct/source properties. Never merge the two.
4. Resolve settings, Avatar/Badge properties, actions, and grouping from the selected curated component policy. Theme-export rows are inventory evidence until incorporated into that policy.
5. When grouping, nested size, or another policy-owned capability is requested but absent from the curated policy, stop with an unsupported-capability result. Do not infer it from compiler column metadata.
6. When the report-column contract is missing or resolves multiple structural alternatives, or the applicable curated policy is unknown, stop with Missing Inputs.
7. Run local validation against the generated composite `component-contracts/<build>.json`. Verify its `capability_provenance` before treating a capability as compiler-derived.

# Generation Rules (MANDATORY)

1. Emit `type: themeTemplateComponent/mediaList` and select exactly one `componentAppearance.display`: `partial` or `report`.
2. Emit native page-region `layout {}` and `appearance {}` blocks. Top-level regions use `slot: body`; nested regions require a verified `parentRegion` and use `regionBody` by default (or explicitly supported `subRegions`) under an existing `@/standard` or `@/content-block` parent. Never create or infer a parent.
3. Require `settings.title`. In report mode, map `title` and optional `description` with bare source aliases because their metadata type is `sessionStateValue`; do not use `&COLUMN_NAME.` syntax for these selectors.
4. In report mode, require a verified data source and one compiler-resolved child column for every delivered projection. Emit exactly the declaration, required properties, blocks, and datatypes selected by the active grammar contract.
5. For a named variant, keep the declaration identifier and accepted database-column mapping synchronized. For an unnamed variant, use the accepted column-name/visibility properties. Apply a primary-key or identity property only when the active column contract exposes it.
6. For SQL-backed reports, keep `source.sqlQuery` free of `ORDER BY` and emit deterministic top-level `orderBy {}`. Use projected aliases only. The supported report adapter is `location: localDatabase` plus `type: sqlQuery`; unsupported source requests stop with Missing Inputs.
7. Preserve the full compiler-supported source contract selected by the owning data-source workflow. Require authoritative evidence for every object and field before object-specific generation.
8. Keep SQL and other sources data-only. Do not generate HTML, links, icons, Badge markup, or Avatar markup in source expressions.
9. Enable Avatar with `settings.displayAvatar: true` and configure it in `plugin-avatar`. Omit both when Avatar is not requested.
10. Enable Badge with `settings.displayBadge: true` and configure it in `plugin-badge`. Omit both when Badge is not requested.
11. Apply the shared Avatar accessibility, URL, icon, and type/payload rules. Canonical Media List image generation is limited to the proven application-managed URL-column scenario; do not infer BLOB contracts.
12. Apply the shared Badge static-label, value datatype, semantic-state, icon, and color-independent meaning rules.
13. Emit grouping only in report mode and only when the curated component policy exposes a report-group block. Use its exact title/icon property names, require a safe title, and put a dynamic group-title alias first in ordering so groups remain contiguous.
14. Emit at most one `action`, with `position: link`, numeric `layout.sequence`, and no `template`. Allow only a reviewed structured `redirectThisApp` target; reject `triggerAction` until validator-visible ownership by a dynamic action is available.
15. Reject arbitrary URL navigation, `targetUrl`, `linkAttributes`, inline event handlers, invented focus behavior, and unresolved row-context mappings.
16. Apply region authorization with an existing shared scheme when visibility is restricted. A navigation target or triggered behavior must enforce the same or stricter authorization independently.
17. Keep native Universal Theme responsiveness. Omit `settings.layout` for the normal single-column flow; select a grid or horizontal layout only from the accepted inventory and only when the owning container width supports it.
18. Omit `settings.applyThemeColors` to inherit its `true` default. Emit `false` only when the requested design intentionally disables Universal Theme row colors.
19. Do not emit unsupported row selection, pagination, action templates, nested properties, custom structural CSS, or custom HTML rendering. Optional nested Avatar/Badge properties must be present in the curated Media List policy, not merely in their standalone owner contracts.
20. Do not synthesize an empty row for a zero-row result. Route a required empty state to an independently supported page/region pattern.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| `regionStaticId` | yes | identifier | Stable region identifier. |
| `name` | yes | string | Useful visible heading/landmark name. |
| `componentAppearance.display` | yes | enum | `partial` or `report`. |
| `source` | report | block | Verified compiler-supported data source. |
| `layout.parentRegion` | nested only | reference | Existing parent resolved by static ID or normalized reference. |
| `layout.slot` | yes | enum | `body` at page level; `regionBody` by default or explicitly supported `subRegions` when nested. |
| `orderBy` | SQL report | block | Deterministic static or item-controlled ordering. |
| `settings.title` | yes | session-state selector | Bare report source alias or existing partial-mode session-state value. |
| `settings.description` | no | session-state selector | Bare report source alias or existing partial-mode session-state value. |
| `settings.displayAvatar` | no | boolean | `true` only when `plugin-avatar` is emitted. |
| `settings.displayBadge` | no | boolean | `true` only when `plugin-badge` is emitted. |
| `settings.applyThemeColors` | report-only | boolean | Omit for the native `true` default; emit `false` only by explicit design intent. |
| `settings.layout` | report-only | enum | `2ColumnGrid`, `3ColumnGrid`, `4ColumnGrid`, `5ColumnGrid`, or `horizontalSpan`. |
| `settings.size` | report-only | enum | `large`. |
| `plugin-avatar` | conditional | block | Shared Avatar type/payload and only the nested properties exposed by the curated Media List policy. |
| `plugin-badge` | conditional | block | Static label, source value, and only the nested properties exposed by the curated Media List policy. |
| `plugin-grouping` | conditional capability | block | Report-only; exact title/icon properties come from the curated Media List policy. |
| `action` | no | child component | At most one `link` action with sequence and a structured same-app redirect. |
| `column variant` | report | compiler contract | Exact named or unnamed declaration selected for the active target. |
| `column source alias` | report | source alias | Uppercase projected alias represented through the selected variant's mapping property. |
| `column.layout.sequence` | report | number | Stable source-order sequence when required or allowed by the active column contract. |
| `column.source.dataType` | report | enum | Exact target-build-supported datatype. |
| `column identity` | conditional | compiler property | Apply only when the active variant exposes a primary-key/identity or visibility property. |
| `security.authorizationScheme` | conditional | reference | Existing region authorization scheme. |

# Output Template – Report Mode

```apexlang
region {{regionStaticId}} (
    name: {{name}}
    type: themeTemplateComponent/mediaList
    source {
        location: {{sourceLocation}}
        type: sqlQuery
        sqlQuery:
            ```sql
            {{source.sqlQuery}}
            ```
    }
    orderBy {
        type: staticValue
        orderByClause: {{orderBy.orderByClause}}
    }
    layout {
        {{parentRegionProperty}}
        sequence: {{layout.sequence}}
        slot: {{layout.slot}}
    }
    appearance {
        template: @/standard
        templateOptions: #DEFAULT#
    }
    componentAppearance {
        display: report
    }
    settings {
        title: {{settings.titleColumn}}
        {{descriptionProperty}}
        {{displayAvatarProperty}}
        {{displayBadgeProperty}}
        {{applyThemeColorsProperty}}
        {{layoutProperty}}
        {{sizeProperty}}
    }
    {{pluginAvatarBlock}}
    {{pluginBadgeBlock}}
    {{policyApprovedGroupingBlock}}
    {{securityBlock}}
    {{compilerResolvedColumnBlocks}}
    {{linkAction}}
)
```

# Conditional Rendering Rules

- In partial mode, omit report-only `source`, `orderBy`, child columns, layout, size, and theme-color settings unless a future curated policy explicitly enables them.
- In report mode, require source coverage and include every projection once through the single active compiler-selected column shape.
- Use bare aliases for `settings.title`, `settings.description`, `plugin-avatar.initials`, `plugin-avatar.image.urlColumn`, `plugin-badge.value`, and `plugin-badge.state` when they select report columns.
- Use `&COLUMN_NAME.` only for free-text properties that support substitution, such as dynamic Avatar descriptions.
- Emit exactly one Avatar type payload. Meaningful Avatars require a description; decorative Avatars omit it and add `AVATAR_PURPOSE_DECORATIVE` to region comments.
- Omit Badge state unless semantic state was explicitly requested and proven to return exact lowercase `danger`, `warning`, `success`, or `info` values.
- Omit grouping and optional nested properties unless requested and exposed by the selected curated policy.
- Omit the action when items are informational. Never emit more than one action.
- Omit optional layout/appearance attributes instead of serializing empty placeholders or guessed defaults.

# Responsive and Accessibility Contract

- The region name and native Standard region header provide the section heading and landmark context.
- Default/no-layout output follows the native one-column Media List flow and is the safest narrow-container choice.
- Use two or three columns for normal body widths. Use four or five only in verified wide containers. `horizontalSpan` intentionally keeps one horizontal row and therefore requires explicit wide-layout intent.
- Do not solve wrapping, spacing, alignment, or visibility with invented CSS. Native Universal Theme handles item wrapping and focus indication.
- Meaningful Avatar content has human-readable alternative text. Decorative Avatar content is hidden from assistive technology while text remains available.
- Badge state color never carries the only meaning; retain a meaningful value and, when context requires it, `displayLabel: true` with a concise static label.
- Native link behavior remains keyboard operable and gets its accessible name from the Media List item content. Do not replace it with an inline handler.

# Security and Edge Cases

- Keep output raw-data-only and declaratively rendered. Do not disable escaping or pass HTML through title, description, Badge, or icon fields.
- Validate every source object, projected field, action target, target item, authorization alias, icon, and state mapping.
- Treat null optional descriptions and badges as data concerns; do not generate conditional DSL structure per row.
- Keep stable deterministic ordering for duplicate titles, normally by appending a verified identity alias as a tie-breaker.
- For action context, project the key through the active Media List column variant, apply its supported identity/visibility property, and use it only in the structured target mapping.
- If a dynamic Avatar description cannot be proven plain-text and meaningful, stop with Missing Inputs.

# Validation Checklist

- Region type and display mode are exact and supported.
- Required title mapping exists and report mappings use bare aliases.
- SQL has no embedded `ORDER BY`; top-level ordering references projected aliases.
- Every report projection has one column using the exact declaration and mappings selected by the active target-build grammar contract.
- Named and unnamed column variants are never mixed; identity/visibility properties are emitted only when exposed by the selected variant.
- Avatar and Badge toggles match their plugin blocks and satisfy their owning contracts.
- Layout, region size, nested size, shape, style, state, grouping, and icon values exist in both theme inventory and the selected curated component policy.
- A requested policy-owned capability absent from the selected curated policy is reported as unsupported rather than inferred from compiler column metadata.
- At most one `link` action exists; it has numeric sequence, no template, no unsafe URL/attributes, and verified authorization/row mappings.
- Unsupported row selection, pagination, HTML rendering, BLOB Avatar, and structural CSS are absent.
