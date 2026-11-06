---

/*
  Chart Feature: Legend Plug-in for Shared Series
  Highlights
  - Integrates Oracle JET Legend plug-in to show series across multiple charts.
  - Legend rows filter linked charts by matching series names.
  - Charts hide their built-in legend to rely on the shared plug-in.
*/

region FEATURE_LEGEND_PLUGIN (
  name: Legend
  type: plugin/APEXLANG$3677104480606292197

  layout {
    sequence: 10
    slot: BODY
  }

  source {
    sqlQuery:
      ```sql
      select distinct customer,
             'Filter: ' || customer description
        from eba_demo_chart_orders
       order by customer
      ```
  }

  appearance {
    template: @/standard
    templateOptions: [
      #DEFAULT#
      t-Region--hideHeader js-addHiddenHeadingRoleDesc
      t-Region--noUI
      t-Region--scrollBody
      t-Form--noPadding
      margin-top-none
      margin-bottom-sm
      margin-left-none
      margin-right-none
    ]
  }

  advanced {
    customAttributes: "style=\"width:100%; height:100px;\""
  }

  settings {
    APEXLANG$3677104673964292202: APEXLANG$3677105068779292203
    APEXLANG$3677106042803292204: APEXLANG$3677106420707292204
  }
)

/* Linked charts share identical series names and set legend.show: false */
