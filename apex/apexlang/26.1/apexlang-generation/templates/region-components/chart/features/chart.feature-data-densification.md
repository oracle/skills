---

/*
  Chart Feature: Data Densification with Window Function
  Highlights
  - Demonstrates filling gaps in time series using analytic functions.
  - Returns zero rows with generated dates for missing periods.
*/

series FEATURE_DATA_DENSIFICATION (
  name: Orders by Month

  source {
    type: sqlQuery
    sqlQuery:
      ```sql
      with monthly_sales as (
        select trunc(order_date, 'MM') month_start,
               sum(order_total)        sales
          from eba_demo_chart_orders
         group by trunc(order_date, 'MM')
      ),
      range_of_months as (
        select add_months(min(month_start), level - 1) as month_start
          from monthly_sales
       connect by level <= months_between(max(month_start), min(month_start)) + 1
      )
      select r.month_start,
             nvl(m.sales, 0) sales
        from range_of_months r
        left join monthly_sales m on m.month_start = r.month_start
       order by 1
      ```
  }

  columnMapping {
    label: MONTH_START
    value: SALES
  }
)
