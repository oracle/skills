# Cards Templates

## Purpose
Canonical guidance for the `cards` region family, including shared contract loading and supported scenario variants.

## Usage
- Load `cards._common.md` first to align variable contracts, guardrails, and required inputs.
- Load `cards._template_options.md` when the request changes region `appearance.templateOptions`.
- Choose a scenario variant matching the requested interaction pattern, data source type, and page composition context.
- For people, product, status, or entity summaries, select the `visual-summary-cards` structured pattern and freeze its source-to-attribute mapping before loading a scenario template.
- When cards need row navigation, model it with native `action` blocks using required `action.type`, `layout.sequence`, `behavior.type`, and the matching target property. Only button actions emit required `label` and `layout.position`.
- Emit `componentAppearance.layout: grid`, `float`, or `horizontal` from explicit layout intent; add `gridColumns` only for `grid` and an explicit fixed 2-5 column Cards grid. Use `componentAppearance.cssClasses` only for a proven container class requirement.
- When cards need images or thumbnails, use the native cards `media` block for this runtime. Use `media.source: blobColumn` with `media.blobColumn` for BLOB-backed images, or `media.source: urlColumn` with `media.urlColumn` when the source already projects a usable image URL column.
- When the source provides image description text, map it to `media.imageDescription`.
- Prefer the native `iconAndBadge.badgeColumn` cards contract whenever the design asks for a badge; only fall back to badge HTML inside title/subtitle/body blocks when a confirmed runtime limitation requires it.
- Every emitted `title`, `subtitle`, `body`, or `secondaryBody` block requires `advancedFormatting`: use `false` with `column` and `true` with `htmlExpression`.
- Inside cards `title.htmlExpression`, `subtitle.htmlExpression`, `body.htmlExpression`, and `secondaryBody.htmlExpression`, use `&COLUMN.` substitution strings rather than `#COLUMN#`; prefer escaped forms such as `&COLUMN!HTML.` for text content.
- Preserve canonical path references and markdown-first conventions when updating workflow or registry links.
- For row-dependent conditional styling, project an allowlisted semantic class alias and map it through compiler-confirmed `card.cssClasses`; retain the status in a native badge or text role.
- Cards actions support native button presentation (`appearance.displayType`, `icon`, `hot`, and `cssClasses`), an `advanced.staticId`, a `serverSideCondition`, and a nested `triggerAction` child when `behavior.type: triggerAction`. Redirect actions require their matching target; `triggerAction` omits both navigation target properties.
- If a region combines a full-card action with a decision button, define the intended interaction precedence and any business conditions in the UX contract. Do not claim the actions are mutually exclusive unless that condition is evidenced.
- For dynamic refresh, identify the trigger and Cards static ID, then load `cards.refresh-on-change.md` or `cards.refresh-after-dialog.md`. Include bound page items in the Cards `source.pageItemsToSubmit`.
- Filtering and search orchestration are outside the visual-summary Cards pattern. Route combined requests to the Faceted Search or Smart Filters owner and use Cards only as its results region.

## Template Catalog
- `cards._common.md`
- `cards._template_options.md`
- `cards.rest-source.md`
- `cards.refresh-on-change.md`
- `cards.refresh-after-dialog.md`
- `cards.standard.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep family guidance aligned with page-level standards in memory-bank rules and with scenario coverage in this folder.
