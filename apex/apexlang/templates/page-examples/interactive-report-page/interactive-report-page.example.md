---
templateId: page-examples.interactive-report-page.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Interactive Report Page Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
page 1 (
    name: Interactive Report
    alias: INTERACTIVE-REPORT
    title: Interactive Report
    appearance {
        pageTemplate: @/standard
        templateOptions: #DEFAULT#
    }
    security {
        pageAccessProtection: argumentsMustHaveChecksum
    }
    advanced {
        reloadOnSubmit: always
    }
    help {
        helpText: Use this report to review project rows, refine the result set with interactive report actions, and open the target page for row-level follow-up. Sort, filter, and save report views when you need a repeatable working set.
    }

    /*
      Example generation guidance
      - SQL source options: table, view, or packaged API (see source.sqlQuery block).
      - Link targets: form pages, modal dialogs, or external URLs using #COLUMN# tokens.
      - Detail view: optional HTML template using report column substitution values.
      - Optional features: highlights, saved reports, pivot view, download formats, and actions menu.
    */

    region APEX$1316572692189768369 (
        name: About this page
        type: staticContent
        source {
            htmlCode: <p>This interactive report was created using the Create Page Wizard. The SQL used to create this report displays in the show/hide region at the bottom of the page. Interactive reports feature built-in search capability in that your search term is used to search across the row.  In addition to the default interactive report functionality, this report has a <strong>Detail</strong> view which you can toggle to by clicking the <strong>Detail View</strong> icon.  You can sort and filter columns by clicking on column headings, click the <strong>Actions</strong> drop down menu to control the columns to display on the report and the order in which they are displayed.  You can also save custom reports, chart data, and perform many other actions.</p>
        }
        layout {
            sequence: 10
            slot: BODY
        }
        appearance {
            template: @/blank-with-attributes
            templateOptions: [
                #DEFAULT#
                margin-bottom-md
            ]
        }
    )

    region APEX$1336408086666747490 (
        name: SQL Source
        type: plugin/APEXLANG$1336406075248737514
        layout {
            sequence: 10
            parentRegion: @APEX$2568412592755125430
            slot: SUB_REGIONS
        }
        appearance {
            template: @/collapsible
            templateOptions: [
                #DEFAULT#
                is-collapsed
                t-Region--noBorder
                t-Region--scrollBody
            ]
        }
        settings {
            APEXLANG$625858662371962867: projects_report
        }
    )

    region APEX$2568412592755125430 (
        name: Projects
        type: interactiveReport
        source {
            location: localDatabase
            type: sqlQuery
            /* Example SQL (self-contained). Replace with real tables/views.
               Example replacements:
               - Table-based IR: select project_id, project, status from projects
               - View-based IR: select * from vw_project_status
               - API-driven IR: select * from app_report_api.get_projects(:P1_FILTER)
            */
            sqlQuery:
                ```sql
                select
                    level as project_id,
                    'Project ' || level as project,
                    'Task ' || level as task_name,
                    date '2024-01-01' + level as start_date,
                    date '2024-02-01' + level as end_date,
                    case mod(level, 4)
                        when 0 then 'Closed'
                        when 1 then 'In Progress'
                        when 2 then 'On Hold'
                        else 'Planned'
                    end as status,
                    'User ' || level as assigned_to,
                    level * 1000 as cost,
                    level * 1500 as budget,
                    (level * 1500) - (level * 1000) as available_budget
                from dual
                connect by level <= 25
                ```
        }
        layout {
            sequence: 20
            slot: BODY
        }
        appearance {
            template: @/interactive-report
            templateOptions: #DEFAULT#
        }
        advanced {
            htmlDomId: projects_report
        }
        link {
            linkColumn: customTarget
            target: {
                page: 10
                items: {
                    P10_ID: #ID#
                    P10_PROJECT_ID: #PROJECT_ID#
                }
                clearCache: 10
            }
            linkIcon: <span role="img" aria-label="Edit" class="fa fa-edit" title="Edit"></span>
        }
        componentAppearance {
            showNullValuesAs: -
        }
        pagination {
            type: rowRangesXToY
        }
        performance {
            maxRowsToProcess: 100000
        }
        messages {
            whenNoDataFound: No data found.
            whenMoreDataFound: This query returns more than #MAX_ROW_COUNT# rows, please filter your data to ensure complete results.
        }
        actionsMenu {
            savePublicReport: true
        }
        download {
            formats: [
                csv
                html
            ]
        }
        detailView {
            show: true
            /* Example detail view template. Replace #COLUMN# tokens to match your SQL projection. */
            beforeRows:
                ```html
                <table class="reportDetail">
                ```
            forEachRow:
                ```html
                <tr>
                  <td class="reportDetail">
                    <h1>#PROJECT#</h1>
                    <b>Assigned to:</b> #ASSIGNED_TO#<br />
                    <b>Start Date:</b> #START_DATE#<br />
                    <b>Budget:</b> #BUDGET#<br />
                    <b>Cost:</b> #COST#<br />
                    <b>Status:</b> #STATUS#<br />
                  </td>
                </tr>
                ```
            afterRows:
                ```html
                </table>
                ```
        }

        column PROJECT_ID (
            type: hidden
            // Hidden Interactive Report columns still require heading metadata.
            heading {
                heading: Project Id
            }
            layout {
                sequence: 10
            }
            source {
                dataType: NUMBER
            }
        )

        column PROJECT (
            type: plainText
            heading {
                heading: Project
            }
            layout {
                sequence: 20
            }
            source {
                dataType: STRING
            }
        )

        column TASK_NAME (
            type: plainText
            heading {
                heading: Task Name
            }
            layout {
                sequence: 30
            }
            source {
                dataType: STRING
            }
        )

        column START_DATE (
            type: plainText
            heading {
                heading: Start Date
            }
            layout {
                sequence: 40
            }
            appearance {
                formatMask: DD-MON-YYYY
            }
            source {
                dataType: DATE
            }
            comments {
                comments: Summary: Project start date shown in the report detail and reused by downstream maintenance flows. Display Label: Start Date. Display in Report: true. Display in Form: true. Format Mask: DD-MON-YYYY. Value Required: true. Read Only: false. Primary Display Column: false. Authorization Scheme: none.
            }
        )

        column END_DATE (
            type: plainText
            heading {
                heading: End Date
            }
            layout {
                sequence: 50
            }
            appearance {
                formatMask: DD-MON-YYYY
            }
            source {
                dataType: DATE
            }
        )

        column STATUS (
            type: plainText
            heading {
                heading: Status
            }
            layout {
                sequence: 60
            }
            source {
                dataType: STRING
            }
        )

        column ASSIGNED_TO (
            type: plainText
            heading {
                heading: Assigned To
            }
            layout {
                sequence: 70
            }
            source {
                dataType: STRING
            }
        )

        column COST (
            type: plainText
            heading {
                heading: Cost
                alignment: end
            }
            layout {
                sequence: 80
                columnAlignment: end
            }
            appearance {
                formatMask: 999G999G999G999G990
            }
            source {
                dataType: NUMBER
            }
        )

        column BUDGET (
            type: plainText
            heading {
                heading: Budget
                alignment: end
            }
            layout {
                sequence: 90
                columnAlignment: end
            }
            appearance {
                formatMask: 999G999G999G999G990
            }
            source {
                dataType: NUMBER
            }
        )

        column AVAILABLE_BUDGET (
            type: plainText
            heading {
                heading: Available Budget
                alignment: end
            }
            layout {
                sequence: 100
                columnAlignment: end
            }
            appearance {
                formatMask: 999G999G999G999G990
            }
            source {
                dataType: NUMBER
            }
        )

        highlight APEX$2683511586813813554 (
            name: Over Budget
            condition {
                column: AVAILABLE_BUDGET
                operator: <
                value: 0
            }
            colors {
                background: #FFFF99
            }
            execution {
                sequence: 10
            }
        )

        savedReport 21844430 (
            visibility: alternativeDefault
            name: Pivot Example
            view {
                pivot: true
                default: pivot
                rowsPerPage: 15
            }

            displayColumn ASSIGNED_TO (
                sequence: 7
            )

            displayColumn AVAILABLE_BUDGET (
                sequence: 11
            )

            displayColumn BUDGET (
                sequence: 9
            )

            displayColumn COST (
                sequence: 8
            )

            displayColumn END_DATE (
                sequence: 5
            )

            displayColumn PROJECT (
                sequence: 2
            )

            displayColumn START_DATE (
                sequence: 4
            )

            displayColumn STATUS (
                sequence: 6
            )

            displayColumn TASK_NAME (
                sequence: 3
            )

            sort (
                column: START_DATE
                sort {
                    sequence: 1
                }
            )

            sort (
                column: END_DATE
                sort {
                    sequence: 2
                }
            )

            sort (
                column: PROJECT
                sort {
                    sequence: 3
                }
            )

            aggregate (
                column: COST
            )

            aggregate (
                column: BUDGET
            )

            pivotCol (
                column: ASSIGNED_TO
                layout {
                    sequence: 1
                }
            )

            pivotRowCol (
                column: PROJECT
                layout {
                    sequence: 1
                }
            )

            pivotAggregate APEX$2203958296814662358 (
                heading: Total Cost
                aggregate {
                    function: sum
                    column: COST
                }
                appearance {
                    formatMask: 999G999G999G999G990
                }
                layout {
                    sequence: 1
                }
            )

            pivotAggregate APEX$2203958696808662358 (
                heading: Total Budget
                aggregate {
                    function: sum
                    column: BUDGET
                }
                appearance {
                    formatMask: 999G999G999G999G990
                }
                layout {
                    sequence: 2
                }
            )

        )

    )

    region APEX$6289081522563100742 (
        name: Breadcrumbs
        type: breadcrumb
        source {
            breadcrumb: @APEX$6289081016089100738
        }
        layout {
            sequence: 40
            slot: REGION_POSITION_01
        }
        appearance {
            template: @/title-bar
            templateOptions: #DEFAULT#
        }
        componentAppearance {
            breadcrumbTemplate: @/breadcrumb
            templateOptions: #DEFAULT#
        }
    )

    button APEX$2662018574486965574 (
        buttonName: RESET_DATA
        label: Reset
        layout {
            sequence: 10
            region: @APEX$2568412592755125430
            slot: RIGHT_OF_IR_SEARCH_BAR
        }
        appearance {
            buttonTemplate: @/icon
            templateOptions: #DEFAULT#
            icon: fa-undo-alt
        }
        behavior {
            action: redirectThisApp
            target: {
                page: 1
                clearCache: 1
                request: RP
                action: resetInteractiveReport
            }
            warnOnUnsavedChanges: doNotCheck
        }
    )

    dynamicAction APEX$219060492896895171 (
        name: Refresh on Edit
        execution {
            sequence: 10
        }
        when {
            event: apexafterclosedialog
            selectionType: region
            region: @APEX$2568412592755125430
        }

        action APEX$219060551554895172 (
            action: refresh
            affectedElements {
                selectionType: region
                region: @APEX$2568412592755125430
            }
            execution {
                sequence: 10
                event: @APEX$219060492896895171
                fireOnInit: false
            }
        )

    )

)
```
