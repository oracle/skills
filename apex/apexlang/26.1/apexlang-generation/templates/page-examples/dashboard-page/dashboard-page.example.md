---
templateId: page-examples.dashboard-page.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Dashboard Page Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
page 9200 (
    name: Dashboard Page Pattern
    alias: DASHBOARD_PAGE_PATTERN
    title: Dashboard Page Pattern
    appearance {
        pageTemplate: @/standard
        templateOptions: #DEFAULT#
    }
    security {
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
    }

    region dashboard-kpis (
        name: Key Metrics
        type: themeTemplateComponent/metricCard
        source {
            location: localDatabase
            type: sqlQuery
            sqlQuery:
                ```sql
                select 1 as ID,
                       'Revenue' as TITLE,
                       '$128K' as METRIC,
                       'Last 30 days' as META
                  from dual
                union all
                select 2 as ID,
                       'Average Order' as TITLE,
                       '$87.42' as METRIC,
                       'Last 30 days' as META
                  from dual
                union all
                select 3 as ID,
                       'Open Orders' as TITLE,
                       '214' as METRIC,
                       'Needs attention' as META
                  from dual
                union all
                select 4 as ID,
                       'Online Orders' as TITLE,
                       '62%' as METRIC,
                       'Channel mix' as META
                  from dual
                union all
                select 5 as ID,
                       'Active Customers' as TITLE,
                       '1,482' as METRIC,
                       'Last 30 days' as META
                  from dual
                ```
        }
        layout {
            sequence: 10
            slot: BODY
        }
        appearance {
            template: @/standard
            templateOptions: #DEFAULT#
        }
        componentAppearance {
            display: report
        }
        settings {
            title: &TITLE.
            metric: &METRIC.
            meta: &META.
            layout: 5Columns
        }

        column ID (
            layout {
                sequence: 10
            }
            source {
                databaseColumn: ID
                dataType: number
                primaryKey: true
            }
        )

        column TITLE (
            layout {
                sequence: 20
            }
            source {
                databaseColumn: TITLE
                dataType: varchar2
            }
        )

        column METRIC (
            layout {
                sequence: 30
            }
            source {
                databaseColumn: METRIC
                dataType: varchar2
            }
        )

        column META (
            layout {
                sequence: 40
            }
            source {
                databaseColumn: META
                dataType: varchar2
            }
        )
    )

    region sales-by-region (
        name: Sales By Region
        type: chart
        layout {
            sequence: 20
            slot: BODY
        }
        appearance {
            template: @/standard
            templateOptions: [
                #DEFAULT#
                t-Region--noBorder
                t-Region--hideHeader js-addHiddenHeadingRoleDesc
                t-Region--scrollBody
            ]
        }
        chart {
            type: pie
        }
        title {
            title: Sales By Region
        }
        legend {
            show: false
        }

        series sales-by-region (
            name: Sales By Region
            execution {
                sequence: 10
            }
            source {
                type: sqlQuery
                sqlQuery:
                    ```sql
                    select 'North America' as LABEL,
                           42 as VALUE
                      from dual
                    union all
                    select 'Europe' as LABEL,
                           31 as VALUE
                      from dual
                    union all
                    select 'Asia Pacific' as LABEL,
                           19 as VALUE
                      from dual
                    union all
                    select 'Latin America' as LABEL,
                           8 as VALUE
                      from dual
                    ```
            }
            columnMapping {
                label: LABEL
                value: VALUE
            }
            label {
                show: true
            }
        )
    )

    region orders-by-month (
        name: Orders By Month
        type: chart
        layout {
            sequence: 30
            slot: BODY
            startNewRow: false
        }
        appearance {
            template: @/standard
            templateOptions: [
                #DEFAULT#
                t-Region--noBorder
                t-Region--hideHeader js-addHiddenHeadingRoleDesc
                t-Region--scrollBody
            ]
        }
        chart {
            type: bar
        }
        title {
            title: Orders By Month
        }
        legend {
            show: false
        }

        series orders-by-month (
            name: Orders By Month
            execution {
                sequence: 10
            }
            source {
                type: sqlQuery
                sqlQuery:
                    ```sql
                    select 'Jan' as LABEL,
                           18 as VALUE
                      from dual
                    union all
                    select 'Feb' as LABEL,
                           24 as VALUE
                      from dual
                    union all
                    select 'Mar' as LABEL,
                           21 as VALUE
                      from dual
                    union all
                    select 'Apr' as LABEL,
                           29 as VALUE
                      from dual
                    ```
            }
            columnMapping {
                label: LABEL
                value: VALUE
            }
        )

        axis x (
            name: x
            value {
            }
            majorTicks {
                show: false
            }
        )

        axis y (
            name: y
            value {
                format: decimal
                decimalPlaces: 0
                formatScaling: none
            }
            majorTicks {
                show: true
            }
        )
    )

    region pipeline-trend (
        name: Pipeline Trend
        type: chart
        layout {
            sequence: 40
            slot: BODY
        }
        appearance {
            template: @/standard
            templateOptions: [
                #DEFAULT#
                t-Region--noBorder
                t-Region--hideHeader js-addHiddenHeadingRoleDesc
                t-Region--scrollBody
            ]
        }
        chart {
            type: line
        }
        title {
            title: Pipeline Trend
        }
        legend {
            show: false
        }

        series pipeline-trend (
            name: Pipeline Trend
            execution {
                sequence: 10
            }
            source {
                type: sqlQuery
                sqlQuery:
                    ```sql
                    select 'Week 1' as LABEL,
                           120 as VALUE
                      from dual
                    union all
                    select 'Week 2' as LABEL,
                           142 as VALUE
                      from dual
                    union all
                    select 'Week 3' as LABEL,
                           156 as VALUE
                      from dual
                    union all
                    select 'Week 4' as LABEL,
                           171 as VALUE
                      from dual
                    ```
            }
            columnMapping {
                label: LABEL
                value: VALUE
            }
        )

        axis x (
            name: x
            value {
            }
            majorTicks {
                show: false
            }
        )

        axis y (
            name: y
            value {
                format: decimal
                decimalPlaces: 0
                formatScaling: none
            }
            majorTicks {
                show: true
            }
        )
    )

    region revenue-outlook (
        name: Revenue Outlook
        type: chart
        layout {
            sequence: 50
            slot: BODY
            startNewRow: false
        }
        appearance {
            template: @/standard
            templateOptions: [
                #DEFAULT#
                t-Region--noBorder
                t-Region--hideHeader js-addHiddenHeadingRoleDesc
                t-Region--scrollBody
            ]
        }
        chart {
            type: area
        }
        title {
            title: Revenue Outlook
        }
        legend {
            show: false
        }

        series revenue-outlook (
            name: Revenue Outlook
            execution {
                sequence: 10
            }
            source {
                type: sqlQuery
                sqlQuery:
                    ```sql
                    select 'Q1' as LABEL,
                           320 as VALUE
                      from dual
                    union all
                    select 'Q2' as LABEL,
                           410 as VALUE
                      from dual
                    union all
                    select 'Q3' as LABEL,
                           465 as VALUE
                      from dual
                    union all
                    select 'Q4' as LABEL,
                           530 as VALUE
                      from dual
                    ```
            }
            columnMapping {
                label: LABEL
                value: VALUE
            }
        )

        axis x (
            name: x
            value {
            }
            majorTicks {
                show: false
            }
        )

        axis y (
            name: y
            value {
                format: decimal
                decimalPlaces: 0
                formatScaling: none
            }
            majorTicks {
                show: true
            }
        )
    )
)
```
