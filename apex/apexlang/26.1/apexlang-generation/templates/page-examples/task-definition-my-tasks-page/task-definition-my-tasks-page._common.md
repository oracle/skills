---
pageExampleId: task-definition-my-tasks-page
componentType: page
version: 1.0
canonicalExample: ./task-definition-my-tasks-page.example.md
---

# Purpose
Shared contract for the task-definition-my-tasks-page page example.

# Load Order
1. Load ./task-definition-my-tasks-page._index.md
2. Load this file (./task-definition-my-tasks-page._common.md)
3. Load ./task-definition-my-tasks-page.example.md for the concrete Markdown-preserved example

# Rules
- Keep task-definition-my-tasks-page.example.md as canonical Markdown-preserved example for this page pattern.
- Apply only the component templates/rules required by the user prompt.
- Do not copy optional regions/items/processes unless requested.

# Conditional Guidance

## When to include
- Use this page example when requirements match this page family's region and process composition.
- Start from task-definition-my-tasks-page.example.md and keep only requested regions/logic.
- Preserve canonical sequencing/order for processes, dynamic actions, and major regions unless prompt requires change.

## Do not generate
- Do not load unrelated page-example families for this request.
- Do not replicate all optional blocks from task-definition-my-tasks-page.example.md by default.
- Do not introduce page-level behavior that contradicts memory-bank rules for the selected page type.
