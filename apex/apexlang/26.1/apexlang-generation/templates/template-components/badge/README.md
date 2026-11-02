# Badge Templates

## Purpose

Canonical standalone report-mode Badge template-component guidance for `themeTemplateComponent/badge`.

## Usage

- Load `badge._index.md`, then `badge._common.md`.
- Load `badge._template_options.md` for the compiler-derived Badge attribute inventory.
- Use `badge.report-minimal.md` for a non-interactive Badge region.
- Use `badge.report-link.md` only when the requirement includes one row-level Badge link.
- Keep partial attachment and custom template-component authoring out of this family.
- Keep labels as plain static text and icons limited to exactly one pinned Font APEX catalog icon with optional catalog-listed modifiers. Treat state as optional explicit intent: omit it when unspecified, and limit requested state results to exact lowercase `danger`, `warning`, `success`, or `info` from any supported projected source.
- Before assigning an icon, load and consult `assets/indexes/font-apex-icon-index.json`; never invent an icon token.
- Use reviewed structured targets. Badge generation must not emit `targetUrl`, arbitrary `linkAttributes`, or inline event handlers.

## Template Catalog

- `badge._index.md`
- `badge._common.md`
- `badge.report-minimal.md`
- `badge.report-link.md`
- `badge._template_options.md`

## Permutation Harness

Run the focused Badge harness from the repository root:

`node --test --test-name-pattern='Badge permutation harness' the source package regression tests`

The harness generates temporary fixtures for all 576 finite combinations of `style`, `shape`, `size`, `displayLabel`, semantic `state`, icon presence, and optional `link` action. It validates them in one pass and removes the fixtures afterward. Focused regression matrices separately validate plain static labels, exact state results, every compiler-supported 26.1 `source.location`/`source.type` shape, and pinned Font APEX icon/modifier membership.

## Maintenance

- Keep the attribute and action guidance aligned with compiler-backed Universal Theme metadata.
- Every scenario must include purpose, output template, conditional rules, and validation checks.
- Keep examples schema-neutral; generated object-specific SQL still requires schema, live DB, or explicit user evidence.
