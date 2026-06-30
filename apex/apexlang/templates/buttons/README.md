# Buttons Templates

## Purpose
Canonical button templates partitioned by action type so workflows can load only what a request needs.

## Usage
- Load `buttons._common.md` first for shared contract and guardrails.
- Load `buttons._index.md` next to route intent to one primary action template.
- Load exactly one primary variant template by `behavior.action`.
- Load overlays only when requested (`confirmation`, `server-side-condition`, `appearance-icon`).
- Resolve allowed button `templateOptions` from the inventory in `buttons._common.md`; pass the accepted emitted UT class value (for example `t-Button--iconLeft`), not a caller-facing alias or `static_id` such as `left`.
- For `@/text-with-icon` buttons with `icon`, default icon placement to `t-Button--iconLeft`; use `t-Button--iconRight` only by explicit request, and do not add either option to `@/icon` buttons.
- Use `buttons.registry.json` when tooling needs a machine-readable catalog for this family.

## Template Catalog
- `buttons._common.md`
- `buttons._index.md`
- `buttons.submit.md`
- `buttons.redirect-this-app.md`
- `buttons.redirect-other-app.md`
- `buttons.defined-by-da.md`
- `buttons.trigger-action.md`
- `buttons.menu.md`
- `buttons.confirmation.md`
- `buttons.server-side-condition.md`
- `buttons.appearance-icon.md`
- `buttons.registry.json`

## Maintenance
- Keep this README synchronized with actual files in this directory.
- Keep action mappings aligned with `assets/rules-mapping.json` and `skills/*` registries.
