---
templateId: region.help-text.standard
componentType: region
version: 1.0
imports:
  - help-text._common
description: Standard help-text region with optional page help and preview JSON contract.
---

# Output Template

```
region {{regionStaticId}} (
  name: {{name}}
  type: helpText
  layout {
    sequence: {{layout.sequence}}
    slot: {{layout.slot}}
  }
  appearance {
    template: {{appearance.template}}
    templateOptions: #DEFAULT#
  }
  headerAndFooter {
    headerText: {{headerAndFooter.headerText}}
    footerText: {{headerAndFooter.footerText}}
  }
)
```

# Batch Preview JSON Skeleton

```json
{
  "target": "P1_SAMPLE_ITEM",
  "scope": "item",
  "textMessageKey": "ITEM.P1_SAMPLE_ITEM.HELP",
  "inlineHelp": { "text": "Short inline help." },
  "detailedHelp": { "text": "Longer guidance for users." },
  "authoritativeSource": "Column comment",
  "localization": ["en"],
  "notes": "Keep inline help concise."
}
```
