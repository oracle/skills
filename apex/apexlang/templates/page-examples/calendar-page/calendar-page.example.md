---
templateId: page-examples.calendar-page.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Calendar Page Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
page 50 (
    name: Calendar
    alias: CALENDAR
    title: Calendar
    appearance {
        pageTemplate: @/standard
        templateOptions: #DEFAULT#
    }
    security {
        pageAccessProtection: argumentsMustHaveChecksum
        formAutoComplete: false
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

    region calendar (
        name: Calendar
        type: calendar
        source {
            location: localDatabase
            type: sqlQuery
            sqlQuery:
                ```sql
                select ID,
                       ITEM_TEXTFIELD as EVENT_LABEL,
                       ITEM_DATEPICKER as START_DATE,
                       ITEM_DATEPICKER as END_DATE,
                       ITEM_NUMBER,
                       ITEM_TEXTAREA,
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
        settings {
            displayColumn: EVENT_LABEL
            startDateColumn: START_DATE
            endDateColumn: END_DATE
            pkColumn: ID
            additionalCalendarViews: [
                list
                navigation
            ]
            viewEditLink: {
                page: 80
                items: {
                    P80_ID: &ID.
                }
            }
        }
    )
        //dynamicActions

)
```
