---
templateId: base-app-structure.index
componentType: template
version: 1.0
imports:
  - base-app-structure._common.md
description: Routing entrypoint for whole-application base app structure templates.
---

# Purpose

Primary routing entrypoint for `base-app-structure` templates.

# Load Order

1. Load this file.
2. Load `base-app-structure._common.md`.
3. Resolve or ask for the destination APEX workspace name, record it in session
   `context-resolution.json` under `db_context.workspace`, and use it for
   `deployments/default.json`.
4. Materialize the required baseline artifacts from `scaffold-example/` into
   the resolved `applications/app_###/` target.
5. Customize identifiers and other run-specific attributes only when they are
   required by the user request, requested structure, or selected template family.
6. Treat optional example content in this family as reference-only unless the
   run explicitly asks for it.
