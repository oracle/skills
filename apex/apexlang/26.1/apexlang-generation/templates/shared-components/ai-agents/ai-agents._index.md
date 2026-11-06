---
templateId: ai-agents.index
componentType: template
version: 1.0
imports:
  - ai-agents._common.md
description: Routing entrypoint for ai-agents templates.
---

# Purpose

Primary routing entrypoint for `ai-agents` templates.

# Load Order

1. Load this file.
2. Load `ai-agents._common.md`.
3. Load one or more tool templates in this folder based on the required behavior.
4. Load `ai-agents.at-tools.parameters.md` when a chosen tool accepts parameters.
