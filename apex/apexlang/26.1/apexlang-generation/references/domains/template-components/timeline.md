# Workflow: Timeline Template Component

## Purpose

Generate a Universal Theme Timeline template component only when the request explicitly selects Timeline. The component is available as `partial` or `report`; it is not a chart and must not be routed to the Gantt/timeline-chart workflow.

## Required Evidence

1. Inspect the bundled Universal Theme Timeline inventory when attribute context is needed:

   ```bash
   node tools/query-valid-props.mjs --template-component timeline --json
   ```

   This result is theme-export metadata only and is not compiler-backed. It may contain attributes that the APEXlang compiler rejects; never use it as legality evidence.
2. Prove emitted structure with the curated Timeline contract and direct compiler validation against the target APEX build. If a requested shape is outside the exact supported fixtures and cannot be validated directly, stop with `Missing Inputs`.
3. For a database-backed source, confirm every referenced table/view and mapped column from offline schema metadata, live DB metadata, or an explicit user assertion.
4. Require verified mappings for Timeline's required component values: `date`, `title`, and `userName`.
5. Stop with `Missing Inputs` if the parent shape, source mode, or required mappings are not proven.

## Supported Configuration

- The authoritative Timeline inventory is `templates/template-components/timeline/timeline._template_options.md`.
- The shared family contract is `templates/template-components/timeline/timeline._common.md`; load it through `timeline._index.md` before selecting an example.
- `templates/template-components/timeline/timeline.report-sample-data.md` is the canonical report-mode sample-data example. Reuse its enclosing shape only when the requested mode, parent context, and source mappings match.
- The root Timeline values exposed by APEXlang belong in `settings`: required `userName`, `date`, and `title`; optional `description`, `displayAvatar`, and `displayBadge`.
- Every Timeline region must emit `source`, `componentAppearance`, and `settings`; omission of any one is a local validation failure.
- When `settings.displayAvatar: true`, emit `plugin-avatar.type` and `plugin-avatar.shape`, then exactly one matching payload: `icon` for `type: icon`, `image` for `type: image`, or `initials` for `type: initials`. For initials, require a projected varchar2 column containing only the first-name and last-name initials (for example, `YB`); do not pass the full `settings.userName` column. `description` is optional. Treat `avatar/avatar._template_options.md` as the canonical shared Avatar inventory for these nested visual attributes, while restricting output to Timeline's compiler-backed `plugin-avatar` properties.
- A nested `plugin-avatar.image` must use `type: urlColumn`, reference a declared varchar2 Timeline child column, and satisfy `AVATAR_IMAGE_URL_SAFETY_REQUIRED_001`: project only `:APP_FILES` or `:APEX_FILES` plus one static relative path. Reject raw, external, protocol-relative, `javascript:`, `data:`, traversal, substitution, and BLOB-endpoint URL sources.
- When `settings.displayBadge: true`, emit `plugin-badge.label` and `plugin-badge.value`; `state`, `icon`, `displayLabel`, `style` (`outline` or `subtle`), and `shape` (`circular`, `rounded`, or `square`) are optional. Treat `badge/badge._template_options.md` as the canonical shared Badge inventory for these nested visual attributes.
- Treat `plugin-avatar.icon` and `plugin-badge.icon` as icon-bearing properties. When a Timeline request explicitly asks for either icon, resolve the `icons` profile and apply `FA_ICON_REQUIRED_001`: select exactly one static icon from the pinned Font APEX index, with only index-listed modifiers. Do not invent `fa-*` tokens. Do not load the index for a Timeline request that does not require an icon.
- Compiler-backed APEXlang legality is authoritative for emitted Timeline structures. Universal Theme `REPORT` and `REPORT_GROUP` metadata does not establish an APEXlang emission shape.
- Do not emit `applyThemeColors`, root `style`, `plugin-grouping`, pagination `type`/`showTotalCount`, or `messages`. Although they appear in Universal Theme metadata, the APEXlang compiler rejects them for Timeline. Keep grouping out of generated output and QA applications until a compiler-supported grouping structure is documented and live-validated.
- The supported-configuration fixture is `templates/template-components/timeline/timeline.permutations.md`. It covers supported Timeline values and conditional branches; use one valid branch per generated region rather than combining mutually-exclusive avatar payloads.
- Load `avatar._template_options.md` only with avatar configuration and `badge._template_options.md` only with badge configuration. The standalone `themeTemplateComponent/avatar` workflow owns a separate report region, source, ordering, security, and accessibility contract; do not copy those standalone rules into Timeline's nested `plugin-avatar` block. Likewise, the standalone `themeTemplateComponent/badge` workflow owns a separate report region, source, and action contract; do not copy those rules into Timeline's nested `plugin-badge` block.
- Timeline exposes the compiler-proven action positions `avatarLink`, `userNameLink`, and `titleLink`, but its profile has no action templates. This workflow does not emit `action` blocks; stop with `Missing Inputs` if a requested action cannot be proven through a target-build grammar contract.

## Security and Rendering

- Preserve default escaping and use the selected application's proven authorization model. Do not invent an authorization scheme or attachment point.
- Do not substitute a static HTML region, a Comments component, or a Gantt chart for Timeline.
- Treat the template option inventory as accepted attribute evidence only; use compiler truth for the enclosing APEXlang region shape and any non-exact configuration.

## Validation

1. Run strict formatter and local APEXlang validation.
2. Run compiler-truth audit with component attributes enabled. Treat it as a local regression gate, not as proof for opaque nested template-component attributes.
3. Run target-build `apex validate` through the runtime roundtrip before declaring the emitted Timeline compiler-valid.
4. Route reported findings through `context repair`; revise only the reported shape or mapping.

Record the target build, application path, `live_check_status`, and validation artifact paths with the review evidence. Local lint and unit tests alone are not compiler acceptance evidence.
