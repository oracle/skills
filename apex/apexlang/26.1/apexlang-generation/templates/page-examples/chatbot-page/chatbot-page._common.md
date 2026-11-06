---
pageExampleId: chatbot-page
componentType: page
version: 1.0
canonicalExample: ./chatbot-page.example.md
---

# Purpose
Shared contract for the chatbot-page page example.

# Load Order
1. Load ./chatbot-page._index.md
2. Load this file (./chatbot-page._common.md)
3. Load ./chatbot-page.example.md for the concrete Markdown-preserved example

# Rules
- Keep chatbot-page.example.md as canonical Markdown-preserved example for this page pattern.
- Treat custom inline chat containers as opt-in only; this example uses a button-triggered assistant launcher.
- Prefer existing AI agent references (for example `@home`) over inline assistant configuration.
- Resolve chatbot agent artifacts from `/shared-components/ai-agents/`.
- Do not copy optional regions/items/processes unless requested.
