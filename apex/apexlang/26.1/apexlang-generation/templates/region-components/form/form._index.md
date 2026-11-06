---
templateId: region.form.index
componentType: region
version: 1.0
imports:
  - form._common.md
  - form._items._common.md
  - form._processes._common.md
description: Routing entrypoint for form region templates.
---

# Purpose

Primary routing entrypoint for `form` region templates.

# Load Order

1. Load this file.
2. Load `form._common.md`.
3. Load `form._items._common.md`.
4. Load `form._processes._common.md`.
5. Load `form.dialog-buttons.md` when the scenario is a dialog form.
6. Load one scenario template in this folder.
