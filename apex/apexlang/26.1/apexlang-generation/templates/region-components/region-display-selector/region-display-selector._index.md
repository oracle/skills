---
templateId: region-display-selector.index
componentType: template
version: 1.0
imports:
  - region-display-selector._common.md
  - region-display-selector.standard.md
  - region-display-selector.permutations.md
description: Routing entrypoint for region-display-selector templates.
---

# Purpose

Primary routing entrypoint for `region-display-selector` templates.

# Load Order

1. Load this file.
2. Load `region-display-selector._common.md`.
3. Load `region-display-selector.standard.md` for generation.
4. Load `region-display-selector.permutations.md` only when configuration coverage or a non-default mode is requested.
