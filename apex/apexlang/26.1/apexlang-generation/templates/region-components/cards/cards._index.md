---
templateId: region.cards.index
componentType: region
version: 1.0
imports:
  - cards._common.md
description: Routing entrypoint for cards region templates.
---

# Purpose

Primary routing entrypoint for `cards` region templates.

# Load Order

1. Load this file.
2. Load `cards._common.md`.
3. Load one SQL or REST source scenario template in this folder.
4. When Cards refresh is requested, additionally load exactly one Cards-owned refresh template matching the trigger.
