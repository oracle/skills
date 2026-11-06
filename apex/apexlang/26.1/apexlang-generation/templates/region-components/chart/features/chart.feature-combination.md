---
templateId: chart.feature.combination
componentType: chart-feature
version: 1.0
imports:
  - ../chart._common.md
description: Mixes bar, area, and line series within a combination chart region.
---

# Purpose


# Usage

- Apply this pattern when demonstrating how multiple chart series types can be displayed together.
- Pair with `chart._common.md` for guardrails and with `chart-dashboard-combination.md` for full region context.

# Example Snippet

```apexlang
region FEATURE_COMBINATION (
    name: Combination Chart (Bar + Line + Area)
    type: chart

    layout {
        sequence: 10
        slot: BODY
    }

    appearance {
        template: @/standard
        templateOptions: [
            #DEFAULT#
            t-Region--scrollBody
        ]
    }

    chart {
        type: combination
    }

    series FEATURE_AREA (
        name: Area Series
        type: area
        columnMapping {
            label: LABEL
            value: AREA_VAL
        }
    )

    series FEATURE_BAR (
        name: Bar Series
        type: bar
        columnMapping {
            label: LABEL
            value: BAR_VAL
        }
    )

    series FEATURE_LINE (
        name: Line Series
        type: line
        columnMapping {
            label: LABEL
            value: LINE_VAL
        }
    )
)
```

# Notes

- Ensure each series specifies its type (`type: area|bar|line`).
- Adjust ordering and legend entries to match UX requirements.

# References

- Related scenario – `chart-dashboard-combination.md`
