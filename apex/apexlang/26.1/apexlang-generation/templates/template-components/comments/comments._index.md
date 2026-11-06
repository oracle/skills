---
templateId: template-component.comments.index
componentType: template-component
version: 1.0
imports:
  - comments._common.md
description: Routing entrypoint for Comments template-component regions.
---

# Purpose

Select the narrowest supported Comments report or partial configuration.

# Load Order

1. Load `comments._common.md`.
2. Load `comments.apex-task-comments.md` as the canonical report example.
3. Load `comments.partial-column.md` when Comments is requested as an Interactive Report column.
4. Load `comments.permutations.md` only when a conditional Avatar, chat, or partial region variant is requested.
5. Load `comments._template_options.md` only when attribute or enum evidence is required.
6. Load the shared Avatar inventory only when nested Avatar rendering is enabled.

# Authority

Use the Comments workflow for compiler-backed legality. Theme-export `REPORT` and `REPORT_GROUP` metadata is inventory evidence only.
