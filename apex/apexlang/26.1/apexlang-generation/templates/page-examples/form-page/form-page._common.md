---
pageExampleId: form-page
componentType: page
version: 1.0
canonicalExample: ./form-page.example.md
---

# Purpose
Shared contract for the form-page page example.

# Load Order
1. Load ./form-page._index.md
2. Load this file (./form-page._common.md)
3. Load ./form-page.example.md for the concrete Markdown-preserved example

# Rules
- Keep form-page.example.md as canonical Markdown-preserved example for this page pattern.
- Apply only the component templates/rules required by the user prompt.
- Do not copy optional regions/items/processes unless requested.

# Conditional Guidance

## When to include
- Use this page example when requirements match this page family's region and process composition.
- Start from form-page.example.md and keep only requested regions/logic.
- Preserve canonical sequencing/order for processes, dynamic actions, and major regions unless prompt requires change.

## Do not generate
- Do not load unrelated page-example families for this request.
- Do not replicate all optional blocks from form-page.example.md by default.
- Do not introduce page-level behavior that contradicts memory-bank rules for the selected page type.
