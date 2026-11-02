---
templateId: region.metric-card.index
componentType: region
version: 1.0
imports:
  - metric-card._common.md
  - metric-card.report-minimal.md
description: Routing entrypoint for metric-card regions.
---

# Purpose

Primary routing entrypoint for `metric-card` region templates.

# Load Order

1. Load this file.
2. Load `metric-card._common.md`.
3. Use `metric-card.partial-minimal.md` for one component without the report wrapper; otherwise default to `metric-card.report-minimal.md`.
4. Load `metric-card.report-avatar-badge.md` only when nested Avatar or Badge content is requested.
5. Load `metric-card.report-link.md` only when row navigation is requested.
6. Load `metric-card.report-grouping-selection.md` only when grouping or native row selection is requested.
7. Load `metric-card.permutations.md` only for QA, regression, or exhaustive permutation requests.
