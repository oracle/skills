---
templateId: static-content.index
componentType: template
version: 1.0
imports:
  - static-content._common.md
  - static-content._nested-region._common.md
  - static-content._button._common.md
description: Routing entrypoint for static-content templates.
---

# Purpose

Primary routing entrypoint for `static-content` templates.

# Load Order

1. Load this file.
2. Load `static-content._common.md`.
3. Load `static-content._nested-region._common.md`.
4. Load `static-content._button._common.md` when the scenario includes button actions.
5. Load one scenario template in this folder.
