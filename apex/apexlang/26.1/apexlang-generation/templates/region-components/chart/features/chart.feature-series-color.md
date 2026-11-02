---

/*
  Chart Feature: Series Color via SQL
  Highlights
  - Sets slice colors using a SQL column alias.
  - Keeps legend synchronized by referencing the alias in `appearance.color`.
*/

series FEATURE_SERIES_COLOR (
  name: Products

  source {
    type: sqlQuery
    sqlQuery:
      ```sql
      select product_name,
             list_price,
             case product_name
               when 'Apples'    then 'green'
               when 'Bananas'   then 'yellow'
               when 'Grapes'    then 'purple'
               when 'Cantaloupe'then 'orange'
               when 'Dates'     then '#791b19'
             end as series_color
        from eba_demo_chart_products
      ```
  }

  columnMapping {
    label: PRODUCT_NAME
    value: LIST_PRICE
  }

  appearance {
    color: &SERIES_COLOR.
  }

  label {
    show: true
    position: outsideSlice
  }
)
