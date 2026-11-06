# Shared Page Layout Contracts

## Purpose
Shared contracts used across multiple page layout families in `page-layout-templates/`.

## What belongs here
- `page.common.md`
  - Shared contract for non-dialog page templates such as `standard/`, `blank/`, `left-side-column/`, `right-side-column/`, `left-and-right-side-columns/`, `minimal-no-navigation/`, `marquee/`, and `login/`.
- `page.modal-dialog.common.md`
  - Shared contract for modal dialog families such as `modal-dialog/` and `wizard-modal-dialog/`.
- `page.drawer.common.md`
  - Shared contract for the `drawer/` dialog family.
- `../README.md`
  - Shared page-template option inventory for all Theme 42 page layouts in this tree.

## How to use
- Do not treat files in this folder as standalone template families.
- Load the relevant shared contract before the family `_common.md` file that builds on it.
- Keep family-specific examples, variants, and routing entrypoints in their own family folders.

## Maintenance
- Keep this folder limited to contracts reused by multiple families.
- Update family READMEs and `_index.md` files whenever shared contract paths change.
- Prefer `_shared/` over root-level placement for reusable page layout contracts in this tree.
