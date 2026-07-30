---
templateId: chart.feature.chart-links
componentType: chart-feature
version: 1.0
imports:
  - ../chart._common.md
description: Adds link targets to chart data points using SQL-generated URLs.
---

# Purpose


# Usage

1. Add a SQL column that returns the desired URL (e.g., `apex_page.get_url`).
2. Enable the series `link` block using `type: redirectUrlReturnedByFirstCol`.
3. Ensure navigation targets respect security (checksums, authorization).

# Example Snippet

```apexlang
series FEATURE_CHART_LINKS (
    name: Sales

    source {
        type: sqlQuery
        sqlQuery:
            ```sql
            select apex_page.get_url(p_page => 10,
                                      p_items => 'P10_PRODUCT',
                                      p_values => product_name) as detail_link,
                   product_name,
                   sum(quantity) total_quantity,
              from eba_demo_chart_orders
             group by product_name
            ```
    }

    columnMapping {
        label: PRODUCT_NAME
        value: TOTAL_QUANTITY
    }

    link {
        type: redirectUrlReturnedByFirstCol
    }
)
```

# Notes

- When linking to other applications, ensure appropriate authorization schemes and session handling.
- Combine with region actions (refresh, modal launch) to keep navigation consistent with UX guidelines.

# References
