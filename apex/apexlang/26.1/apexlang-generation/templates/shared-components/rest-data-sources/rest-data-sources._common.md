---
templateId: shared-components.rest-data-sources.common
componentType: shared-component
version: 1.0
description: Canonical contract for REST Data Source discovery, profile, operations, and synchronization settings.
---

# Purpose
Define REST Data Source configuration using discovery-first rules and validated data profiles.

# Required Inputs
- remote server alias
- endpoint base/path and operations
- discovered profile fields (including nested structures)
- explicit synchronization requirements when requested

# Guardrails
- Never guess profile shape.
- Use `restSource` references for page/process integration.
- Treat synchronization schedule values as explicit inputs, never defaults.
