---

templateId: chart.feature.3d-effect
componentType: chart-feature
version: 1.0
imports:
  - ../chart._common.md
description: Adds drop shadow and bar gap to simulate a 3D effect on column/bar charts.
---

# Purpose


# Example Snippet

```apexlang
chartAppearance {
    shadow {
        color: #000000
        offsetX: 4
        offsetY: 4
        opacity: 0.4
    }
    gapRatio: 0.4
}
```

# Usage Notes

- Apply inside the target chart region after selecting a compatible chart type (bar/column/combination).
- Tune `offsetX`, `offsetY`, and `opacity` to balance the effect with your theme.
- Remove the block entirely for flatter presentation when accessibility or clarity would suffer.

# References

- Related module: `charts/config/config-data-label-formatting.md`
