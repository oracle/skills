---
templateId: page-examples.map-page.page.example
componentType: markdown-apexlang-example
version: 1.0
migrationNote: preserved from previous standalone template example
---

# Map Page Example

## Purpose

Markdown-preserved APEXlang example. Use this file for syntax and structure only after loading the family `_index.md` and `_common.md` contract.

## Example

```apexlang
page 90 (
    name: Customers
    alias: CUSTOMERS
    title: Customers
    appearance {
        pageTemplate: @/standard
        templateOptions: #DEFAULT#
    }
    navigation {
        cursorFocus: doNotFocusCursor
        warnOnUnsavedChanges: false
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
            slot: breadcrumbBar
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

    region map (
        name: Customers
        type: map
        layout {
            sequence: 10
            slot: body
        }
        appearance {
            template: @/standard
            templateOptions: #DEFAULT#
        }
        controls {
            options: [
                scaleBar
                infiniteMap
                rectangleZoom
            ]
        }
        initialPositionAndZoom {
            type: sqlQuery
            sqlQuery:
                ```sql
                 select avg(g.longitude) as map_lon,
                        avg(g.latitude) as map_lat,
                        4 as zoom_level
                   from cms_customer_geolocation g
                ```
            geometryColumnDataType: longitudeLatitude
            initialLongitudeColumn: MAP_LON
            initialLatitudeColumn: MAP_LAT
            initialZoomlevelColumn: ZOOM_LEVEL
        }
        attributes {
            messagesPosition: below
        }

        layer customers (
            name: Customers
            layout {
                sequence: 10
            }
            source {
                tableName: CUSTOMER_GEOLOCATION
            }
            columnMapping {
                geometryColumnDataType: longitudeLatitude
                longitudeColumn: LONGITUDE
                latitudeColumn: LATITUDE
            }
            tooltip {
                column: SOURCE_ADDRESS
            }
        )

    )

)
```
