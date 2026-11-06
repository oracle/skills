---

/*
  Chart Feature: Customizing Tooltip Labels
  Highlights
  - Uses `series.labelTooltip` to show formatted values.
  - Demonstrates tooltip text controlled by SQL columns.
*/

series FEATURE_CUSTOM_TOOLTIP (
  name: Orders

  source {
    type: sqlQuery
    sqlQuery:
      ```sql
      select product_name,
             quantity,
             to_char(quantity, '999,990') as tooltip_text
        from eba_demo_chart_orders
       where customer = 'Acme Store'
      ```
  }

  columnMapping {
    label: PRODUCT_NAME
    value: QUANTITY
    labelTooltip: TOOLTIP_TEXT
  }

  label {
    show: true
  }
)
