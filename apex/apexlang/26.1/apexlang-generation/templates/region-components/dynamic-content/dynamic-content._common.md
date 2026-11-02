---
templateId: region.dynamic-content.common
componentType: region
version: 1.0
description: Shared contract for dynamic-content regions.
---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Region static id. |
| source.plsqlFunctionBody | yes | plsql | Must return renderable text/HTML payload. |
| appearance.template | yes | ref | Region template; default to `@/standard`. |

# Guardrails

- Dynamic content PL/SQL should render content only; avoid DML side effects.
- Escape user-derived values before HTML emission.
- Prefer declarative regions when equivalent behavior exists.
- Use `appearance.template: @/standard` unless the prompt explicitly asks for another documented shell.
