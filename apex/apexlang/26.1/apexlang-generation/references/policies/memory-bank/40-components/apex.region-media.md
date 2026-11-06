# APEX Region Media and BLOBs

## Purpose
Defines reusable APEXlang BLOB, file/image, storage companion, and visual-token contracts for region components.

## BLOB Display Contract
- `Datatype: blob` is supported only in Form, Cards, Content Row, Classic Report, and Interactive Report regions.
- Valid render roles are Form: `fileUpload`, `imageUpload`, `displayImage`; Cards/Content Row/Classic Report/Interactive Report: `displayImage`.
- Any region displaying a BLOB must include primary keys for lookup.
- Companion storage columns such as MIME type, alt text, filename, last-updated, and character set must appear in the same region columns block; hide them when they are metadata-only.
- SQL-backed Classic Report and Interactive Report BLOB display aliases must project `dbms_lob.getlength(<blob_expr>)`; Cards and Content Row must project the raw BLOB expression for display-image aliases.
- Raw LOB projection is display-only. Do not sort, group, distinct, join, analytically partition/order, or compare raw LOB aliases; follow `SQL_PLSQL_LOB_COMPARISON_KEY_FORBIDDEN_001` in `20-data/apex.sql.md`.
- Cards image display uses the native Cards media block, not report-style child columns.
- Cards BLOB display uses `media { advancedFormatting: false source: blobColumn blobColumn: <BLOB_COLUMN_ALIAS> position: first sizing: cover }`.
- Cards URL-column display uses `media { advancedFormatting: false source: urlColumn urlColumn: <URL_COLUMN_ALIAS> position: first sizing: cover }`.
- Cards direct URL display uses `media { advancedFormatting: false source: imageUrl url: <STATIC_IMAGE_URL_OR_COLUMN_SUBSTITUTION> position: first sizing: cover }`; `url` may be a static URL or an APEX substitution such as `&IMAGE_URL_COLUMN.`.
- Cards BLOB metadata uses `blobAttributes { mimeTypeColumn: <MIME_TYPE_ALIAS> lastUpdatedColumn: <LAST_UPDATED_ALIAS> }`, and that block is valid only when `media.source: blobColumn` is present.
- Native Cards media requires `advancedFormatting`, `position`, and, when `source` is set, `sizing`. Use deterministic defaults `advancedFormatting: false`, `position: first`, and `sizing: cover`.
- Supported presentation values are `position: first | body | background`, optional `appearance: square | widescreen`, and `sizing: fit | cover`.
- Map accessible image text with `media.imageDescription`; `accessibleDescription` is not a Cards media property in the APEX 26.1 grammar.
- Cards regions with BLOB media must define `card.primaryKeyColumn1` and keep companion image metadata columns projected in SQL when available, but must not invent additional `media` or `blobAttributes` properties.
- `Storage -> File Types` is Form-only for upload render roles and must be a comma-separated MIME-type list; `File Name Column` must be normalized to `Filename Column`.
- `Alt Text Column` applies only to image upload/display flows and must not be used for plain file upload.

## Icons and Visual Tokens
- When the prompt specifies an icon allowlist file, use only `fa-*` tokens from that file for menu/list icons, metric icons, report link icons, and button icons.
- If no allowlist is available, choose conservative Font APEX-style `fa-*` tokens and avoid custom CSS classes as semantic icons.
- Generated icon-bearing properties must use Font APEX `fa-*` classes only. Do not emit image icons, Material/Oracle JET icon aliases, custom CSS icon aliases, or framework-specific icon classes in `icon`, `imageIconCssClasses`, `iconCssClasses`, `linkIcon`, or `noDataFoundIcon`.
- Do not invent icon aliases or translate icon tokens; keep icon strings literal and template-compatible.
- Use icons to reinforce navigation/action meaning, not as the only accessible label.

Tags: apexlang, region, blob, file-upload, image-upload, display-image, icon, icon-allowlist
