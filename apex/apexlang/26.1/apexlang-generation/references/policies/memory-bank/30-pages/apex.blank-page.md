## Blank Page Standards

### Purpose
- Provide deterministic scaffolding for blank pages that intentionally render no body regions.

### Rules (Non-Negotiable)
1. Set `pageTemplate: @/standard` with `templateOptions: #DEFAULT#` (matching the canonical blank page example).
2. Do not add BODY regions by default; the page should only contain supporting regions such as breadcrumb if required.
3. Apply navigation/breadcrumb policies from `apex.page.md`; include a breadcrumb region in `REGION_POSITION_01` when the application requires it.

### Guidance
- Mirror `templates/page-examples/blank-page/blank-page._index.md` for layout and optional breadcrumb region.
- When content is later added, follow the relevant component guardrails (e.g., static content region or shared component references) instead of extending this rule file.