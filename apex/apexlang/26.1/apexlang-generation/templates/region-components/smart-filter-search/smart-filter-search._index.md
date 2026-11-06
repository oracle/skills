---
templateId: smart-filter-search.index
componentType: template
version: 1.0
imports:
  - smart-filter-search._common.md
description: Routing entrypoint for smart-filter-search templates.
---

# Purpose

Primary routing entrypoint for `smart-filter-search` templates.

# Load Order

1. Resolve the `smart-filter-search` pattern and construction pack.
2. Load this file.
3. Load `smart-filter-search._common.md` and freeze every required input.
4. Load `smart-filter-search.standard.md` only when its exact component shape matches.
