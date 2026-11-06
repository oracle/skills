---
templateId: region.faceted-search.button-bar
componentType: region
version: 1.0
imports:
  - faceted-search._common.md
description: Companion button-bar region generated for faceted search pages.
---

# Purpose

Document the generated button-bar support region used to render active facets above the result region.

# Generation Rules (MANDATORY)

1. Load `faceted-search._common.md` first.
2. Use this region only as a support region for faceted search.

# Variable Contract

## Required Variables

- `source.htmlCode`
- `appearance.template`

# Output Template – Full

```apexlang
region button-bar (
  name: Button Bar
  type: staticContent
  source {
    htmlCode: <div id="active_facets"></div>
  }
  appearance {
    template: @/buttons-container
  }
)
```

# Conditional Rendering Rules

- Keep this companion region separate from the faceted-search shell.
