# Login Templates

## Purpose
Canonical guidance for the `@/login` page layout family and its markdown entrypoints.

## Usage
- Load [`../_shared/page.common.md`](../_shared/page.common.md) first for shared non-dialog context, then load `login._common.md` for the login-specific contract.
- Load `login.basic.md` for a baseline example.
- Keep login-only authentication and slot guidance in this family rather than reusing `@/login` for authenticated pages.

## Template Catalog
- `login._common.md`
- `login.basic.md`

## Maintenance
- Keep this README synchronized with actual files in the directory.
- Preserve the markdown-only contract for page layout templates in this tree.
- Keep slot and template-option guidance aligned with current Theme 42 metadata.
