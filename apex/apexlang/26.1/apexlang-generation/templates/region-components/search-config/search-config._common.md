---
templateId: region.search-config.common
componentType: region
version: 1.0
description: Shared contract for search regions using searchConfig.
---

# Variable Contract

| Name | Required | Type | Notes |
|------|----------|------|-------|
| searchRegionStaticId | yes | string | Search region static id. |
| searchPageItem | yes | string | Page item capturing search text. |
| searchSource.searchConfig | yes | ref | Shared search configuration reference. |
| headerRegion | optional | ref | Header region when search item is in PLUGIN_SEARCH slot. |
| appearance.template | optional | string | Default to `@/standard` for the search-config region shell. |

# Guardrails

- `settings.searchPageItem` must reference an existing page item.
- `searchSource.searchConfig` must reference a valid shared search configuration component.
- Use `appearance.template: @/standard` unless the surrounding page pattern documents a different shell.
