# Workflow: Region Display Selector

## Purpose

Generate one native Region Display Selector (RDS) that deterministically controls an explicit set of sibling page regions without introducing a data source.

## Required Inputs

- Page target.
- At least two controlled region identifiers.
- Mode: `viewSingleRegion` or `scrollWindow`.
- Whether controlled-region icons are displayed.
- For `viewSingleRegion`, whether Show All is included.
- Persistence: `byUser`, `bySession`, or `false`.
- Optional application-scoped `includeSlider` only when explicitly requested.

## Compiler Evidence

- APEX 26.1 native metadata identifies the plugin as `NATIVE_DISPLAY_SELECTOR`.
- `rds_mode` accepts `STANDARD` (View Single Region) and `JUMP` (Scroll Window).
- `include_show_all` is available only for `STANDARD`.
- `display_region_icons` is Yes/No.
- `remember_selection` accepts `USER`, `SESSION`, and `NO`.
- The upstream catalog also defines application-scoped `include_slider` with default `true`. In this repository it is emitted, when explicitly requested, through `componentSetting NATIVE_DISPLAY_SELECTOR` and `settings.attributes.includeSlider`; it is not a controller setting.
- APEXlang generation uses the normalized values in the required-input list. Run target-build `apex validate` because static compiler-property metadata does not expose the native plugin's custom setting inventory.
- Apply the shared RDS identifier contract in `region-display-selector._common.md`; direct target-build validation is authoritative for region identifiers.

## Generation Contract

1. Create exactly one page-level region with `type: regionDisplaySelector`.
2. Do not emit a `source` block on the controller.
3. Emit `settings.mode`, `settings.displayRegionIcons`, and `settings.rememberSelection` explicitly.
4. Emit `settings.includeShowAll` only when mode is `viewSingleRegion`; omit it for `scrollWindow`.
5. Resolve the exact controlled-region list before generation. Do not infer every body region as a target.
6. On each selected region, emit `advanced.regionDisplaySelector: true` and a stable `advanced.htmlDomId`.
7. Leave the flag omitted or false on every unselected region.
8. Preserve controlled-region `layout.sequence`; it defines selector order.
9. Never select the controller, breadcrumb regions, nested regions, or regions placed in header/breadcrumb slots.
10. When `displayRegionIcons: true`, every selected region must emit one catalogue-valid `appearance.icon` under `FA_ICON_REQUIRED_001`.
11. Mixed target families are supported when each target is a page-level region whose compiler contract accepts `advanced.regionDisplaySelector`. Preserve each template component's own source, settings, nested-component, and column rules.
12. Keep application-scoped `includeSlider` out of the controller's four instance-level settings; emit its `componentSetting` only when the application requirement explicitly requests it.

## Interaction Semantics

- `viewSingleRegion`: selecting an entry displays that region and hides the other selected regions. Show All may expose all selected regions.
- `scrollWindow`: all selected regions remain visible; selecting an entry scrolls to that region. `includeShowAll` is inapplicable and must be omitted.
- `byUser`: persists selection across sessions for the user and therefore requires stable selected-region DOM IDs.
- `bySession`: persists selection only for the current session.
- `false`: does not remember selection.

## Safety Boundary

RDS is presentation behavior, not access control. Preserve authorization schemes, server-side conditions, and data protections on every selected region. Do not use an RDS-hidden region as a security boundary.

## Validation

- Reject zero or one selected region.
- Reject more than one RDS controller on a page.
- Reject a controller that opts itself into RDS.
- Reject selected breadcrumb/header regions.
- Reject `includeShowAll` in `scrollWindow` mode.
- Reject a missing controlled-region icon when `displayRegionIcons: true`.
- Run strict structure formatting, local APEXlang validation, compiler-truth audit, and target-build `apex validate`.

## Templates

- `templates/region-components/region-display-selector/region-display-selector._common.md`
- `templates/region-components/region-display-selector/region-display-selector.standard.md`
- `templates/region-components/region-display-selector/region-display-selector.permutations.md`
