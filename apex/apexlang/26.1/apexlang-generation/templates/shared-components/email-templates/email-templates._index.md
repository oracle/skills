---
templateId: email-templates.index
componentType: template
version: 1.0
imports:
  - email-templates._common.md
description: Routing entrypoint for email-templates templates.
---

# Purpose

Primary routing entrypoint for `email-templates` templates.

# Load Order

1. Load this file.
2. Load `email-templates._common.md`.
3. Generate or update `shared-components/email-templates.example.md` using the shared contract in `email-templates._common.md`.
4. Add additional email templates as sibling top-level `emailTemplate` definitions in the same `email-templates.apx` file.
5. Only after the template exists in `shared-components/email-templates.example.md`, generate any process or action that invokes it.
