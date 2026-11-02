---
pageExampleId: global_page_0
componentType: page
version: 1.0
canonicalExample: ./global_page_0.example.md
---

# Purpose
Shared contract for the global_page_0 page example.

# Load Order
1. Load ./global_page_0._index.md
2. Load this file (./global_page_0._common.md)
3. Load ./global_page_0.example.md for the concrete Markdown-preserved example

# Rules
- Keep global_page_0.example.md as canonical Markdown-preserved example for this page pattern.
- Keep Page 0 minimal: `page 0` with `name: Global Page` only, unless explicitly adding components intended to render globally on every page.
- Do not emit `security`, `authorizationScheme`, `authentication`, `pageAccessProtection`, or `formAutoComplete` on Page 0; normal non-login page security blocks do not apply to the Global Page artifact.
- Apply only the component templates/rules required by the user prompt.
- Do not copy optional regions/items/processes unless requested.
