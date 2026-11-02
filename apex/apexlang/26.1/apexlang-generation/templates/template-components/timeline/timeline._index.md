---
templateId: region.timeline.index
componentType: region
version: 1.0
imports:
  - timeline._common.md
  - timeline._template_options.md
description: Routing entrypoint for Timeline template-component regions.
---

# Purpose

Select the narrowest supported Timeline report or partial configuration.

# Load Order

1. Load `timeline._common.md`.
2. Load `timeline._template_options.md` when attribute or enum evidence is required.
3. Load exactly one matching example: `timeline.report-sample-data.md` for the canonical report shape or `timeline.permutations.md` for conditional branches.
4. Load the shared Avatar or Badge inventory only when the requested nested component is enabled.

# Authority

Use the Timeline workflow for compiler-backed legality. Theme-export `REPORT` and `REPORT_GROUP` metadata is inventory evidence only.
