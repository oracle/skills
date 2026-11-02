---
templateId: region.region-display-selector.permutations
componentType: region
version: 1.0
imports:
  - region-display-selector._common
description: Complete valid setting matrix for native Region Display Selector generation.
---

# Valid Configuration Matrix

The valid matrix contains 18 combinations:

- `viewSingleRegion`: 2 icon values x 2 Show All values x 3 persistence values = 12.
- `scrollWindow`: 2 icon values x 3 persistence values = 6. `includeShowAll` must be omitted.

| Mode | Display Region Icons | Include Show All | Remember Selection |
|------|----------------------|------------------|--------------------|
| `viewSingleRegion` | `false` or `true` | `false` or `true` | `false`, `bySession`, or `byUser` |
| `scrollWindow` | `false` or `true` | omit | `false`, `bySession`, or `byUser` |

# Scroll Window Settings

Use the same controller and controlled-region structure from `region-display-selector.standard.md`, replacing only the settings block:

```apexlang
region section_selector (
    name: Section Selector
    type: regionDisplaySelector
    layout {
        sequence: 10
        slot: body
    }
    appearance {
        template: @/blank-with-attributes-no-grid
        templateOptions: #DEFAULT#
    }
    settings {
        mode: scrollWindow
        displayRegionIcons: false
        rememberSelection: bySession
    }
    advanced {
        htmlDomId: section-selector
    }
)
```

# Invalid Combinations

- Reject `includeShowAll` when `mode: scrollWindow`.
- Reject a controller with fewer than two controlled regions.
- Reject a controller that opts itself into RDS.
- Reject breadcrumb and header-region targets.
- Reject `displayRegionIcons: true` when any controlled region lacks `appearance.icon`.
