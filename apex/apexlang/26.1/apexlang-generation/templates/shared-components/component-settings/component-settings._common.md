---
templateId: shared-components.component-settings.common
componentType: shared-component
version: 1.0
description: Canonical contract for shared component default settings.
---

# Purpose
Define deterministic defaults for APEX component settings. Use this markdown family as canonical input; `component-settings.example.md` preserves concrete syntax when needed.

# Required Inputs
- component static ID / native type
- component category (`item`, `region`, `process`, `dynamicAction`, `restSource`)
- compiler-validated `settings { attributes: {...} }` payload for the chosen component type

# Guardrails
- For current compiler compatibility, use `settings { attributes: {...} }` for component settings.
- Application-scoped plug-in attributes belong in a `componentSetting` declaration; do not add them to a page component's instance-level `settings` block.
- Do not emit direct keys inside `settings {}` (for example `display_as`, `mode`, `match_mode`).
- Do not invent unsupported component categories.
- Keep environment-specific values out of templates.
