# Workflow: Comments Template Component

## Purpose

Generate a Universal Theme Comments template component only when the request explicitly selects Comments. The component is available as `partial` or `report`; it is not a static-content region and must not be treated as developer documentation comments.

## Required Evidence

1. Inspect the bundled Universal Theme Comments inventory when attribute context is needed:

   ```bash
   node tools/query-valid-props.mjs --template-component comments --json
   ```

   This result is theme-export metadata only and is not compiler-backed. It may contain attributes that the APEXlang compiler rejects; never use it as legality evidence.
2. Prove emitted structure with the curated Comments contract and direct compiler validation against the target APEX build. If a requested shape is outside the exact supported fixtures and cannot be validated directly, stop with `Missing Inputs`.
3. For a database-backed source, confirm every referenced table/view and mapped column from offline schema metadata, live DB metadata, or an explicit user assertion. The bundled examples use only the user-confirmed `APEX_TASK_COMMENTS(CREATED_BY, TEXT, CREATED_ON)` source.
4. Require direct declared child-column mappings for Comments' required `userName` and `commentText` values and optional `date`; require an accepted `style` enum in report mode and omit `style` in partial mode.
5. Stop with `Missing Inputs` if the parent shape, source mode, or required mappings are not proven.

## Supported Configuration

- The authoritative Comments inventory is `templates/template-components/comments/comments._template_options.md`.
- The shared family contract is `templates/template-components/comments/comments._common.md`; load it through `comments._index.md` before selecting an example.
- `templates/template-components/comments/comments.apex-task-comments.md` is the canonical report-mode SQL example. Reuse its enclosing shape only when the requested mode, parent context, and source mappings match.
- The root Comments values exposed by APEXlang belong in `settings`: `userName` and `commentText` are always required; `style` is required only for report display and rejected for partial display; `date`, `attributes`, `commentClass`, `displayAvatar`, `alignment`, and `applyThemeColors` are optional.
- Every Comments region must emit `source`, `componentAppearance`, and `settings`; omission of any one is a local validation failure.
- When `settings.displayAvatar: true`, emit `plugin-avatar.type` and `plugin-avatar.shape`, then exactly one matching payload: `icon` for `type: icon`, `image` for `type: image`, or `initials` for `type: initials`. For initials, require a dedicated projected varchar2 column containing only the first-name and last-name initials; do not pass the full `settings.userName` column.
- Do not map `plugin-avatar.initials` to `INITIALS` when the Comments source is `sampleData: tasks`. Live APEX 26.1 runtime evidence reports `ORA-00904: "D"."INITIALS": invalid identifier`; use a verified SQL-projected initials column such as `AVATAR_INITIALS`, or omit the initials permutation when no such projection is available.
- A nested `plugin-avatar.image` must use `type: urlColumn`, reference a declared varchar2 Comments child column, and satisfy `AVATAR_IMAGE_URL_SAFETY_REQUIRED_001`: project only `:APP_FILES` or `:APEX_FILES` plus one static relative path. Reject raw, external, protocol-relative, `javascript:`, `data:`, traversal, substitution, and BLOB-endpoint URL sources.
- Treat `avatar/avatar._template_options.md` as the canonical shared Avatar inventory for nested visual values. The standalone `themeTemplateComponent/avatar` workflow owns a separate report region, source, ordering, security, accessibility, and CSS contract; do not copy those standalone rules into Comments' nested `plugin-avatar` block.
- Treat `plugin-avatar.icon` as icon-bearing. When a Comments request explicitly asks for an Avatar icon, resolve the `icons` profile and apply `FA_ICON_REQUIRED_001`: select exactly one static icon from the pinned Font APEX index, with only index-listed modifiers. Do not invent `fa-*` tokens or load the index for a request that does not require an icon.
- Treat author initials, user initials, profile-image, profile-picture, and author/user-icon wording as nested Avatar intent and load the shared Avatar inventory without selecting the standalone Avatar component.
- A Comments `partial` component renders one entity. Require a source proven to return no more than one row; for SQL, use an explicit `fetch first 1 row only` or an equivalent `rownum` bound. Omit `settings.style` and do not emit the report-only `rowSelection`, `performance`, `pagination`, `entityTitle`, `messages`, or `advanced` blocks in partial mode.
- Report-mode Comments may use compiler-confirmed `rowSelection`, `performance`, `pagination`, `entityTitle`, `messages`, and `advanced` blocks. Omit `rowSelection` for no selection; when selection is requested, use `focusOnly`, `singleSelection`, or `multipleSelection`. Use `pagination.type: page`, keep `pagination.entitiesPerPage` positive, and keep report source projections synchronized with named child columns.
- Compiler-backed APEXlang legality is authoritative. Universal Theme `REPORT` and `REPORT_GROUP` metadata does not establish an APEXlang emission shape.
- Do not emit nested `plugin-badge` or `plugin-grouping` blocks. A request for a badge on each comment is an unsupported nested combination and must not load or apply the standalone Badge region contract. A direct APEX 26.1 probe rejects `plugin-grouping.groupTitle` and `plugin-grouping.groupIcon` as invalid application-source properties; grouping is unsupported for generated APEXlang. Comments actions are supported only at `actions`, `avatarLink`, and `userNameLink`: use root `position`, `label` only for `actions`, numeric `layout.sequence`, and structured `behavior.target`; omit `template` and `behavior.type`.
- The supported-configuration fixture is `templates/template-components/comments/comments.permutations.md`. Use one valid branch per generated region rather than combining mutually exclusive Avatar payloads.

## Security and Rendering

- Preserve default escaping and use the selected application's proven authorization model. Do not invent an authorization scheme or attachment point.
- Keep `attributes` free of scriptable markup, URLs, and event handlers. Keep `commentClass` to static CSS tokens or a declared varchar2 source-column mapping; do not use substitutions or arbitrary dynamic CSS classes.
- Do not substitute a static HTML region, a Timeline component, or a report with hand-written comment markup.
- Treat the template option inventory as accepted attribute evidence only; use compiler truth for the enclosing APEXlang region shape and any non-exact configuration.

## Validation

1. Run strict formatter and local APEXlang validation.
2. Run compiler-truth audit with component attributes enabled. Treat it as a local regression gate, not as proof for opaque nested template-component attributes.
3. Run target-build `apex validate` through the runtime roundtrip before declaring the emitted Comments component compiler-valid.
4. Route reported findings through `context repair`; revise only the reported shape or mapping.

Record the target build, application path, `live_check_status`, and validation artifact paths with the review evidence. Local lint and unit tests alone are not compiler acceptance evidence.

## AUX-2687 target-build evidence

- Target compiler/runtime: APEX `26.1.0+3102`, build-root `apex sql`, saved connection `apex_26.1.0-3102`.
- Positive QA coverage: report Comments, partial Comments, partial Interactive Report Comments column, icon/image/initials Avatar variants, and `actions`/`avatarLink`/`userNameLink` actions all passed target validation with `live_check_status: pass` and zero unresolved problems.
- Validate-only roundtrip: local, live, and final checks all passed; import was skipped by explicit `validate-only` intent.
- Expected unsupported probes: `plugin-grouping` failed target validation on `groupTitle` and `groupIcon`; nested `plugin-badge` failed target validation on `display`. These cases remain rejected with deterministic guidance and are not emitted.
