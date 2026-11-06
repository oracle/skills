---
templateId: region.static-content.nested-region.common
componentType: region
version: 1.0
imports:
  - static-content._common.md
description: Shared contract for nested static-content child regions.
---

# Purpose

Standardize nested child region blocks used by static-content scenario variants.

---

# Variable Contract

## Required Variables

- `childRegion.staticId`
- `childRegion.name`
- `childRegion.parentRegion`
- `childRegion.layout.sequence`
- `childRegion.layout.slot`
- `childRegion.appearance.template`

## Optional Variables

- `childRegion.source.htmlCode`
- `childRegion.appearance.templateOptions`
- `childRegion.headerAndFooter.*`
- `childRegion.serverSideCondition.*`

---

# Output Template – Child Region Block

```apexlang
region {{childRegion.staticId}} (
  name: {{childRegion.name}}
  type: staticContent
  source {
    htmlCode: {{childRegion.source.htmlCode}}
  }
  layout {
    sequence: {{childRegion.layout.sequence}}
    parentRegion: @{{childRegion.parentRegion}}
    slot: {{childRegion.layout.slot}}
  }
  appearance {
    template: {{childRegion.appearance.template}}
    templateOptions: {{childRegion.appearance.templateOptions}}
  }
  headerAndFooter {
    headerText: {{childRegion.headerAndFooter.headerText}}
    footerText: {{childRegion.headerAndFooter.footerText}}
  }
)
```

---

# Conditional Rendering Rules

- Omit optional blocks when values are not provided.
- Ensure `parentRegion` exists in the same scenario output.
- Child regions under the same `parentRegion + slot` share a local 12-column grid that resets inside the parent region.
