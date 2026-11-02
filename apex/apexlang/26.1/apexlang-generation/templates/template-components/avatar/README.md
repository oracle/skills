# Avatar Templates

## Purpose

Canonical standalone Avatar template pack for `themeTemplateComponent/avatar` in report mode.

## Usage

- Load `avatar._common.md` first for the shared region, source, ordering, settings, and column contract.
- Use `avatar._index.md` to select exactly one display scenario.
- Use `avatar._template_options.md` for accepted Avatar attributes and enum values.
- Emit one explicit child `column <UPPERCASE_SNAKE_CASE> (...)` for every projected source column; lowercase or hyphenated external identifiers fail live validation.
- Keep SQL ordering in top-level `orderBy {}`; do not place `ORDER BY` inside `source.sqlQuery`.
- Bind `settings.initials` with the direct uppercase source-column identifier. Use `&COLUMN_NAME.` only for free-text settings such as `description`, not for the initials column selector.
- For restricted Avatar data, use `mustNotBePublicUser` or an `@alias` that resolves to an existing shared authorization declaration in the validation set.
- Use report mode only in this pack. Partial mode requires separate compiler and runtime evidence.

## Action Template Applicability

The Avatar theme export declares the `link` action position but declares no action templates (`actionTemplates: []`). Therefore this pack does not apply an action-template scenario. The separate generic link-action shape remains deferred until its target mapping and security behavior have dedicated evidence.

## Patterns and Anti-Patterns

- Pattern: one report-mode Avatar family selected by initials, icon, or URL-column image.
- Pattern: explicit source projection, deterministic top-level ordering, and one named template-component child column per projection.
- Pattern: region authorization using an existing shared authorization scheme when the owning page or application contract restricts access.
- Pattern: SQL image projections use canonical `:APP_FILES` or `:APEX_FILES` bind concatenation with a static relative path; template tokens, substitutions, BLOB endpoints, unsafe paths, and external URL forms are rejected.
- Pattern: exact Font APEX catalog membership for literals and every output of a column-backed icon mapping.
- Pattern: verified descriptions for meaningful Avatars with recorded evidence provenance; decorative templates omit both description property and column and carry the exact decorative-purpose comment.
- Pattern: native shape, size, and spacing before static component-scoped custom CSS; custom CSS always carries a comments rationale.
- Anti-pattern: falling back to Classic Report or Interactive Report to simulate Avatar rendering.
- Anti-pattern: inventing authorization scheme names or relying on UI hiding as authorization.
- Anti-pattern: raw URL or icon columns, arbitrary icon classes, dynamic CSS substitutions, visibility-changing CSS, or undocumented framework utilities.
- Anti-pattern: emitting BLOB images, grouping, generic link actions, or partial mode without dedicated evidence.

## Template Catalog

- `avatar._common.md`
- `avatar._index.md`
- `avatar.report-initials.md`
- `avatar.report-icon.md`
- `avatar.report-image-url-column.md`

## Deferred Variants

- BLOB-backed images
- report grouping
- generic link actions (the export has a `link` position but no action templates)
- partial mode

These variants require dedicated policy or live-runtime confirmation before becoming canonical scenarios.

## Maintenance

- Keep this README, `avatar._index.md`, and `../template-components.registry.json` synchronized.
- Do not add a scenario from prose or neighboring component behavior alone; require Avatar-specific compiler evidence.
