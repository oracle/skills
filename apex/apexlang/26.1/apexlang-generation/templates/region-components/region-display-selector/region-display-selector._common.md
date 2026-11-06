---
templateId: region.region-display-selector.common
componentType: region
version: 1.0
description: Shared contract for region display selector patterns.
---

# Attribute Contract

The upstream APEX catalog is reference metadata for this family. Its five settings
are split by scope: four are component-instance settings and `includeSlider` is an
application setting. The catalog names and defaults are normalized to the
APEXlang names below.

| Catalog scope | Catalog/native setting | APEXlang name | Valid values | Catalog default | Generation-time policy |
|------|----------|------|------|------|------|
| Component | `rds_mode` / `mode` | `settings.mode` | `viewSingleRegion`, `scrollWindow` | `viewSingleRegion` | Emit explicitly. |
| Component | `display_region_icons` | `settings.displayRegionIcons` | `true`, `false` | not declared | Emit explicitly. |
| Component | `include_show_all` | `settings.includeShowAll` | `true`, `false` | `true` when active | Emit explicitly for `viewSingleRegion`; omit for `scrollWindow`. |
| Component | `remember_selection` | `settings.rememberSelection` | `byUser`, `bySession`, `false` | `byUser` | Emit explicitly. |
| Application | `include_slider` | `componentSetting NATIVE_DISPLAY_SELECTOR` → `settings.attributes.includeSlider` | `true`, `false` | `true` | Optional; emit only when explicitly requested. |

Catalog defaults describe upstream metadata; they are not permission to omit
required instance settings during deterministic generation. `includeSlider` is not
an RDS controller setting and is not required for ordinary RDS page generation.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| controllerRegion | yes | object | Exactly one `type: regionDisplaySelector` region on the page. |
| controllerRegionHtmlDomId | yes | string | Stable RDS controller DOM identifier emitted as `advanced.htmlDomId`. |
| controlledRegions | yes | array | At least two explicitly selected sibling page regions. |
| settings.mode | yes | enum | `viewSingleRegion` or `scrollWindow`. |
| settings.displayRegionIcons | yes | boolean | When `true`, every controlled region supplies a valid `appearance.icon`. |
| settings.includeShowAll | conditional | boolean | Required only for `viewSingleRegion`; omit for `scrollWindow`. |
| settings.rememberSelection | yes | enum | `byUser`, `bySession`, or `false`. |
| applicationSettings.includeSlider | optional | boolean | Application-scoped setting emitted through `componentSetting NATIVE_DISPLAY_SELECTOR`. |

# Repository Implementation and Compiler Constraints

The following rules are repository generation/validation constraints. They keep
membership deterministic and must not be read as additional upstream catalog
requirements.

- The controller is a navigation region and must not define `source` or query data.
- Create one controller per page. The RDS contract has no controller identifier on a target region, so multiple controllers create ambiguous membership.
- Require at least two controlled regions and set `advanced.regionDisplaySelector: true` only on that explicit list.
- Controlled regions may mix native and theme template component families when each selected region supports the `advanced.regionDisplaySelector` property in the active compiler contract.
- Never opt the controller itself, a breadcrumb region, or a region placed in a header/breadcrumb slot into the selector.
- Leave unrelated page regions at the default (`regionDisplaySelector` omitted or `false`).
- Keep controlled regions in stable `layout.sequence` order; that order defines the selector order.
- `viewSingleRegion` shows one selected region. `scrollWindow` leaves all controlled regions visible and scrolls to the selected region.
- Emit `settings.includeShowAll` only for `viewSingleRegion`.
- `rememberSelection: byUser` or `bySession` requires stable target-region DOM IDs in this repository's validator; `false` stores no selection.
- When `displayRegionIcons: true`, reuse the shared `FA_ICON_REQUIRED_001` catalogue rule for every controlled region icon.
- RDS visibility is presentation only. Preserve each controlled region's own authorization scheme and server-side condition.

# Identifier Contract

`staticId` and `htmlDomId` are not interchangeable. For `region` declarations in
this compiler, including the RDS controller and targets, `advanced.htmlDomId` is
authoritative. Use `advanced.htmlDomId`; `advanced.staticId` is rejected by direct
target-build validation.
`staticId` remains available only for component types whose own contracts declare
it. Do not transfer an identifier property from another component kind to a
region.

# Authority Boundary

- APEX 26.1 native metadata identifies the plugin as `NATIVE_DISPLAY_SELECTOR` and stores `rds_mode` as `STANDARD` or `JUMP`.
- The upstream catalog records application-scoped `include_slider` with default `true`; this repository exposes it through the shared `componentSetting` contract.
- APEXlang uses the normalized values documented above. Direct compiler validation and target-build `apex validate` remain authoritative before completion.
