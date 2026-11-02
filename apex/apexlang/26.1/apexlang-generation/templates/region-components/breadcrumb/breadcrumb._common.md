---
templateId: region.breadcrumb.common
componentType: region
version: 1.0
description: Shared contract for breadcrumb regions.
---

# Purpose
Define standard wiring for breadcrumb source and template variants.

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| regionStaticId | yes | string | Breadcrumb region static id. |
| page.title | yes | string | Current page title or current breadcrumb entry label used for title-bar display. |
| source.breadcrumb | yes | ref | Shared breadcrumb component alias. |
| componentAppearance.breadcrumbTemplate | yes | ref | Breadcrumb template reference. |
| layout.slot | yes | enum | `BODY` or `PLUGIN_NAVIGATION` when nested. |
| layout.parentRegion | conditional | ref | Required for nested header composition. |

# Guardrails

- Always point `source.breadcrumb` to a valid shared breadcrumb component.
- Breadcrumb/title-bar regions are visible page chrome. Do not emit generic visible names such as `Breadcrumb`, `Breadcrumbs`, `Title Bar`, or `Page Header`; use the current page title/current breadcrumb entry as the region name.
- For `appearance.template: @/title-bar`, keep `templateOptions: #DEFAULT#` unless live compiler/theme metadata proves another option is valid. Do not emit stale `use-current-breadcrumb-entry` or `t-BreadcrumbRegion--useBreadcrumbTitle`.
- When adding a parent entry, use the {{name}} attribute from the parent and replace {{parent.name}}
