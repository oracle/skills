---
pageExampleId: interactive-report-page
componentType: page
version: 1.0
canonicalExample: ./interactive-report-page.example.md
---

# Purpose
Shared contract for the interactive-report-page page example.

# Load Order
1. Load ./interactive-report-page._index.md
2. Load this file (./interactive-report-page._common.md)
3. Load ./interactive-report-page.example.md for the concrete Markdown-preserved example

# Rules
- Keep interactive-report-page.example.md as canonical Markdown-preserved example for this page pattern.
- Apply only the component templates/rules required by the user prompt.
- Do not copy optional regions/items/processes unless requested.

# Conditional Guidance

## When to include
- Use this page example when requirements match this page family's region and process composition.
- Start from interactive-report-page.example.md and keep only requested regions/logic.
- Preserve canonical sequencing/order for processes, dynamic actions, and major regions unless prompt requires change.

## Do not generate
- Do not load unrelated page-example families for this request.
- Do not replicate all optional blocks from interactive-report-page.example.md by default.
- Do not introduce page-level behavior that contradicts memory-bank rules for the selected page type.
