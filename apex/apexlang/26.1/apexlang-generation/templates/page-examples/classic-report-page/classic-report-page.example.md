---
templateId: page-examples.classic-report-page.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Classic Report Page Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Pagination Note

- This example uses the default classic-report pagination value `rowRangesXToYNoPagination`.
- If paging controls are required, switch to a classic-report-supported value such as `rowRangesXToYOfZWithPagination`; do not use interactive-report tokens such as `rowRangesXToY` or `rowRangesXToYOfZ`.

## Example

```apexlang
page 20 (
    name: Classic Report
    alias: CLASSIC-REPORT
    title: Classic Report
    appearance {
        pageTemplate: @/standard
        templateOptions: #DEFAULT#
    }
    security {
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
    }
    help {
        helpText: Use this classic report to review sample rows quickly, compare the main text and number fields, and open related maintenance flows only after confirming the row values shown in the report.
    }

    region breadcrumb (
        name: Breadcrumb
        type: breadcrumb
        source {
            breadcrumb: @breadcrumb
        }
        layout {
            sequence: 10
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

    region classic-report (
        name: Classic Report
        type: classicReport
        source {
            location: localDatabase
            type: sqlQuery
            sqlQuery:
                ```sql
                select ID,
                       ITEM_NUMBER,
                       ITEM_DATEPICKER,
                       ITEM_DATEPICKER_TZ,
                       ITEM_TEXTAREA,
                       ITEM_TEXTFIELD,
                       ITEM_SELECT_LIST_STATIC,
                       ITEM_SELECT_LIST_DYNAMIC,
                       ITEM_RADIO_GROUP,
                       ITEM_CHECKBOX,
                       ITEM_OPTIONAL,
                       ITEM_REQUIRED
                  from SAMPLE
                ```
        }
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
        componentAppearance {
            template: @/standard
            templateOptions: [
                #DEFAULT#
                t-Report--stretch
                t-Report--horizontalBorders
            ]
        }
        security {
            authorizationScheme: mustNotBePublicUser
        }
        pagination {
            type: rowRangesXToYNoPagination
        }
        messages {
            whenNoDataFound: No data found
        }

        // Tip: For same-app drill links, prefer declarative page targets on the link column. Use SQL-generated URLs only when URL mode is explicitly required.
        column ID (
            reportColumnQueryId: 1
            derivedColumn: N
            heading {
                heading: Id
                alignment: end
            }
            layout {
                sequence: 10
                columnAlignment: end
            }
        )

        column ITEM_CHECKBOX (
            reportColumnQueryId: 10
            derivedColumn: N
            heading {
                heading: Item Checkbox
                alignment: start
            }
            layout {
                sequence: 100
                columnAlignment: start
            }
        )

        column ITEM_DATEPICKER (
            reportColumnQueryId: 3
            derivedColumn: N
            heading {
                heading: Item Datepicker
            }
            layout {
                sequence: 30
            }
        )

        column ITEM_DATEPICKER_TZ (
            reportColumnQueryId: 4
            derivedColumn: N
            heading {
                heading: Item Datepicker Tz
            }
            layout {
                sequence: 40
            }
        )

        column ITEM_NUMBER (
            reportColumnQueryId: 2
            derivedColumn: N
            heading {
                heading: Item Number
                alignment: end
            }
            layout {
                sequence: 20
                columnAlignment: end
            }
            comments {
                comments: Summary: Numeric sample value displayed in the report for simple amount-style comparisons. Display Label: Item Number. Display in Report: true. Display in Form: true. Format Mask: none. Value Required: false. Read Only: false. Primary Display Column: false. Authorization Scheme: none.
            }
        )

        column ITEM_OPTIONAL (
            reportColumnQueryId: 11
            derivedColumn: N
            heading {
                heading: Item Optional
                alignment: start
            }
            layout {
                sequence: 110
                columnAlignment: start
            }
        )

        column ITEM_RADIO_GROUP (
            reportColumnQueryId: 9
            derivedColumn: N
            heading {
                heading: Item Radio Group
                alignment: end
            }
            layout {
                sequence: 90
                columnAlignment: end
            }
        )

        column ITEM_REQUIRED (
            reportColumnQueryId: 12
            derivedColumn: N
            heading {
                heading: Item Required
                alignment: start
            }
            layout {
                sequence: 120
                columnAlignment: start
            }
            comments {
                comments: Summary: Required sample text column shown in the report so missing core values can be spotted during review. Display Label: Item Required. Display in Report: true. Display in Form: true. Format Mask: none. Value Required: true. Read Only: false. Primary Display Column: false. Authorization Scheme: none.
            }
        )

        column ITEM_SELECT_LIST_DYNAMIC (
            reportColumnQueryId: 8
            derivedColumn: N
            heading {
                heading: Item Select List Dynamic
                alignment: end
            }
            layout {
                sequence: 80
                columnAlignment: end
            }
        )

        column ITEM_SELECT_LIST_STATIC (
            reportColumnQueryId: 7
            derivedColumn: N
            heading {
                heading: Item Select List Static
                alignment: end
            }
            layout {
                sequence: 70
                columnAlignment: end
            }
        )

        column ITEM_TEXTAREA (
            reportColumnQueryId: 5
            derivedColumn: N
            heading {
                heading: Item Textarea
                alignment: start
            }
            layout {
                sequence: 50
                columnAlignment: start
            }
        )

        column ITEM_TEXTFIELD (
            reportColumnQueryId: 6
            derivedColumn: N
            heading {
                heading: Item Textfield
                alignment: start
            }
            layout {
                sequence: 60
                columnAlignment: start
            }
            comments {
                comments: Summary: Primary sample text field shown in the report and reused in the corresponding form flow. Display Label: Item Textfield. Display in Report: true. Display in Form: true. Format Mask: none. Value Required: false. Read Only: false. Primary Display Column: true. Authorization Scheme: none.
            }
        )

    )

)
```
