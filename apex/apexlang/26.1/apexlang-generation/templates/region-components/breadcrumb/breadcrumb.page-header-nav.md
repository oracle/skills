---
templateId: region.breadcrumb.page-header-nav
componentType: region
version: 1.0
imports:
  - breadcrumb._common
description: Page header container with nested breadcrumb in PLUGIN_NAVIGATION.
---

# Pattern

- Define page-header region (theme template component) in `REGION_POSITION_01`.
- Add breadcrumb child region with `slot: PLUGIN_NAVIGATION` and `parentRegion` pointing to page header.
