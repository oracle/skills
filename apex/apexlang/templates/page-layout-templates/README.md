# Page Layout Templates

## Purpose
Catalog of markdown-first Theme 42 page layout contracts and family variants used by APEXlang routers and template workflows.

## What is in this directory

- `_shared/`
  - Shared page-template contracts reused across multiple families.
- Family folders such as `blank/`, `standard/`, `drawer/`, `login/`, and `wizard-modal-dialog/`
  - Each folder contains the family-specific contract, routing entrypoint, and baseline or scenario variants.

Current layout families:
- `blank/`
- `drawer/`
- `left-and-right-side-columns/`
- `left-side-column/`
- `login/`
- `marquee/`
- `minimal-no-navigation/`
- `modal-dialog/`
- `right-side-column/`
- `standard/`
- `wizard-modal-dialog/`

## How to use this directory

- Load the relevant shared contract before a family-specific layout:
  - `_shared/page.common.md` for non-dialog families
  - `_shared/page.modal-dialog.common.md` for modal dialog families
  - `_shared/page.drawer.common.md` for drawer families
- Load the family `_index.md`, then the family `_common.md`, then a variant or scenario markdown file.
- Pair the chosen layout family with compatible page archetypes and region templates for deterministic page composition.
- Resolve allowed `appearance.templateOptions` values from the inventory below; pass the documented `static_id`, not the emitted CSS class string.
- Keep `#DEFAULT#` standalone when present and keep documented composite values atomic.
- Preserve markdown-only path references when updating workflow or registry links.
- Use `page-layout-template-family-registry.json` when tooling needs a machine-readable catalog for this family.

## Theme 42 Page Template Options

Use the listed `static_id` as the exact value to pass in `appearance.templateOptions`.
Example: `appearance { templateOptions: [sticky-header-on-mobile] }`

`Preset` shows the checked-in baseline already emitted by the template itself.

### Blank (`blank`)
Preset: none

- Contain Body Content | `static_id=contain-body-content` | `css=t-PageBody--contain` | `group=--`

### Drawer (`drawer`)
Preset: `js-dialog-class-t-Drawer--pullOutEnd`

- Remove Body Padding | `static_id=remove-body-padding` | `css=t-Dialog--noPadding` | `group=--`
- Extra Large | `static_id=extra-large` | `css=js-dialog-class-t-Drawer--xl` | `group=Size`
- Large | `static_id=large` | `css=js-dialog-class-t-Drawer--lg` | `group=Size`
- Medium | `static_id=medium` | `css=js-dialog-class-t-Drawer--md` | `group=Size`
- Small | `static_id=small` | `css=js-dialog-class-t-Drawer--sm` | `group=Size`
- Bottom | `value=js-dialog-class-t-Drawer--pullOutBottom` | `css=js-dialog-class-t-Drawer--pullOutBottom` | `group=Position`
- End | `value=js-dialog-class-t-Drawer--pullOutEnd` | `css=js-dialog-class-t-Drawer--pullOutEnd` | `group=Position`
- Start | `value=js-dialog-class-t-Drawer--pullOutStart` | `css=js-dialog-class-t-Drawer--pullOutStart` | `group=Position`
- Top | `value=js-dialog-class-t-Drawer--pullOutTop` | `css=js-dialog-class-t-Drawer--pullOutTop` | `group=Position`

### Left and Right Side Columns (`left-and-right-side-columns`)
Preset: none

- Sticky Header on Mobile | `static_id=sticky-header-on-mobile` | `css=js-pageStickyMobileHeader` | `group=--`

### Left Side Column (`left-side-column`)
Preset: none

- Sticky Header on Mobile | `static_id=sticky-header-on-mobile` | `css=js-pageStickyMobileHeader` | `group=--`

### Login (`login`)
Preset: none

- Background 1 | `static_id=background-1` | `css=t-LoginPage--bg1` | `group=Page Background`
- Background 2 | `static_id=background-2` | `css=t-LoginPage--bg2` | `group=Page Background`
- Background 3 | `static_id=background-3` | `css=t-LoginPage--bg3` | `group=Page Background`
- Split | `static_id=split` | `css=t-LoginPage--split` | `group=Page Layout`

### Marquee (`marquee`)
Preset: none

- Sticky Header on Mobile | `static_id=sticky-header-on-mobile` | `css=js-pageStickyMobileHeader` | `group=--`

### Minimal (No Navigation) (`minimal-no-navigation`)
Preset: none

- Sticky Header on Mobile | `static_id=sticky-header-on-mobile` | `css=js-pageStickyMobileHeader` | `group=--`

### Modal Dialog (`modal-dialog`)
Preset: none

- Remove Body Padding | `static_id=remove-body-padding` | `css=t-Dialog--noPadding` | `group=--`
- Stretch to Fit Window | `static_id=stretch-to-fit-window` | `css=ui-dialog--stretch` | `group=--`

### Right Side Column (`right-side-column`)
Preset: none

- Sticky Header on Mobile | `static_id=sticky-header-on-mobile` | `css=js-pageStickyMobileHeader` | `group=--`

### Standard (`standard`)
Preset: none

- Sticky Header on Mobile | `static_id=sticky-header-on-mobile` | `css=js-pageStickyMobileHeader` | `group=--`

### Wizard Modal Dialog (`wizard-modal-dialog`)
Preset: none

- Remove Body Padding | `static_id=remove-body-padding` | `css=t-Dialog--noPadding` | `group=--`
- Stretch to Fit Window | `static_id=stretch-to-fit-window` | `css=ui-dialog--stretch` | `group=--`

## Directory Rules
- Keep only the catalog `README.md`, the `_shared/` folder, and family folders at the root of `page-layout-templates/`.
- Put cross-family contracts in `_shared/`.
- Keep family-specific contracts and variants inside their corresponding family folders.

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Update catalogs and usage notes whenever templates are added, removed, or renamed.
- Keep slot and template-option guidance aligned with current Theme 42 metadata and checked-in examples.
- Keep `page-layout-template-family-registry.json` aligned with the shared folder and family directories.
