# Cards Templates

## Purpose
Canonical guidance for the `cards` region family, including shared contract loading and supported scenario variants.

## Usage
- Load `cards._common.md` first to align variable contracts, guardrails, and required inputs.
- Load `cards._template_options.md` when the request changes region `appearance.templateOptions`.
- Choose a scenario variant matching the requested interaction pattern, data source type, and page composition context.
- When cards need row navigation, model it with native card `action` blocks using `label` plus declarative `behavior.target`; do not emit `position` on native Cards actions.
- Use the optional `componentAppearance.gridColumns` control only when the design needs a fixed 2-5 column cards grid; otherwise omit it to keep the default automatic layout.
- When cards need images or thumbnails, use the native cards `media` block for this runtime. Use `media.source: blobColumn` with `media.blobColumn` for BLOB-backed images, or `media.source: urlColumn` with `media.urlColumn` when the source already projects a usable image URL column.
- When the source provides image description text, map it to `media.accessibleDescription`.
- Prefer the native `iconAndBadge.badgeColumn` cards contract whenever the design asks for a badge; only fall back to badge HTML inside title/subtitle/body blocks when a confirmed runtime limitation requires it.
- When cards `title`, `subtitle`, `body`, or `secondaryBody` use `htmlExpression`, emit `advancedFormatting: true` on that same block.
- Inside cards `title.htmlExpression`, `subtitle.htmlExpression`, `body.htmlExpression`, and `secondaryBody.htmlExpression`, use `&COLUMN.` substitution strings rather than `#COLUMN#`; prefer escaped forms such as `&COLUMN!HTML.` for text content.
- Preserve canonical path references and markdown-first conventions when updating workflow or registry links.

## Template Catalog
- `cards._common.md`
- `cards._template_options.md`
- `cards.rest-source.md`
- `cards.standard.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.
