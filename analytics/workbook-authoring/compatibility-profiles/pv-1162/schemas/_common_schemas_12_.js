// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizNarrative",
   "type": "object",
   "properties": {
      "analysisType": {
         "type": "string",
         "const": "TREND"
      },
      "lang": {
         "$ref": "http://oracle.com/bi/language/0.0.0/"
      },
      "meaningOfUpGadgetDailyRate": {
         "type": "string",
         "const": "BAD"
      },
      "textStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "lod": {
         "type": "integer",
         "minimum": 0,
         "maximum": 4294967295
      },
      "tones": {
         "anyOf": [
            {
               "type": "string",
               "const": "FACTUAL"
            },
            {
               "type": "string",
               "const": "CASUAL"
            },
            {
               "type": "string",
               "const": "BUSINESS"
            }
         ]
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizNetworkchart",
   "type": "object",
   "properties": {
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "line"
            }
         ]
      },
      "xAxis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis"
      },
      "yAxis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis"
      },
      "x2Axis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis"
      },
      "y2Axis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis"
      },
      "numberFormat": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/numberFormat"
      },
      "legend": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChart/legend"
      },
      "percentDecimalPlaces": {
         "anyOf": [
            {
               "type": "integer",
               "minimum": 0,
               "maximum": 255
            },
            {
               "type": "number",
               "const": -1
            }
         ]
      },
      "aspectRatioLocked": {
         "type": "boolean"
      },
      "showTitle": {
         "anyOf": [
            {
               "type": "string",
               "const": "none"
            },
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "custom"
            }
         ]
      },
      "showTitleTooltip": {
         "anyOf": [
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "none"
            }
         ]
      },
      "titleTooltip": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/"
      },
      "useTitleInTooltip": {
         "type": "boolean"
      },
      "hideAndShowBehavior": {
         "type": "string",
         "const": "withRescale"
      },
      "hoverBehavior": {
         "type": "string",
         "const": "dim"
      },
      "selectionMode": {
         "type": "string",
         "const": "multiple"
      },
      "drilling": {
         "type": "string",
         "const": "on"
      },
      "animationOnDataChange": {
         "type": "string",
         "const": "auto"
      },
      "coordinateSystem": {
         "type": "string",
         "const": "cartesian"
      },
      "stack": {
         "type": "string",
         "const": "off"
      },
      "showTotal": {
         "type": "boolean"
      },
      "treatNullsAs": {
         "anyOf": [
            {
               "type": "string",
               "const": "zero"
            },
            {
               "type": "string",
               "const": "gap"
            }
         ]
      },
      "stackLabel": {
         "anyOf": [
            {
               "type": "string",
               "const": "on"
            },
            {
               "type": "string",
               "const": "off"
            }
         ]
      },
      "labelStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "textStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "preventTimeAxisBarOverlap": {
         "type": "boolean"
      },
      "dateTimeLabels": {
         "type": "boolean"
      },
      "horizontalAlignment": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "left"
            },
            {
               "type": "string",
               "const": "right"
            },
            {
               "type": "string",
               "const": "center"
            }
         ]
      },
      "dataValues": {
         "type": "boolean"
      },
      "transparency": {
         "type": "integer"
      },
      "zoomAndScroll": {
         "anyOf": [
            {
               "type": "string",
               "const": "off"
            },
            {
               "type": "string",
               "const": "live"
            }
         ]
      },
      "viz_map": {
         "type": "object",
         "properties": {
            "viewport": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizMapViewport"
            },
            "_settingsVersion": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "0.0.0"
                  },
                  {
                     "type": "string",
                     "const": "1.0.0"
                  }
               ]
            },
            "detectLatLongForTextColumns": {
               "type": "boolean"
            },
            "forceLegacyMapviewerRenderer": {
               "type": "boolean"
            },
            "repeatBackground": {
               "type": "boolean"
            },
            "autoFocusOnData": {
               "type": "boolean"
            },
            "zoomControlEnabled": {
               "type": "boolean"
            },
            "scaleBarUnit": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "BOTH"
                  },
                  {
                     "type": "string",
                     "const": "IMPERIAL"
                  },
                  {
                     "type": "string",
                     "const": "METRIC"
                  },
                  {
                     "type": "string",
                     "const": "NONE"
                  }
               ]
            },
            "tileLayerType": {
               "type": "string"
            },
            "mouseWheelZoomingEnabled": {
               "type": "boolean"
            },
            "_defaultTileBackground": {
               "type": "string",
               "const": "elocation"
            },
            "_useMaxBoundsForMapboxViewport": {
               "type": "boolean"
            },
            "backgroundMapsConfig": {
               "type": "object",
               "properties": {
                  "oracle_osm": {
                     "type": "object",
                     "properties": {
                        "tileLayer": {
                           "anyOf": [
                              {
                                 "type": "string",
                                 "const": "osm_darkmatter"
                              },
                              {
                                 "type": "string",
                                 "const": "osm_bright"
                              },
                              {
                                 "type": "string",
                                 "const": "osm_positron"
                              }
                           ]
                        }
                     },
                     "required": [
                        "tileLayer"
                     ],
                     "additionalProperties": false
                  },
                  "oracle_dataviz_osm": {
                     "type": "object",
                     "properties": {
                        "tileLayer": {
                           "anyOf": [
                              {
                                 "type": "string",
                                 "const": "dataviz-default-thematic"
                              },
                              {
                                 "type": "string",
                                 "const": "dataviz-bright"
                              },
                              {
                                 "type": "string",
                                 "const": "dataviz-light"
                              },
                              {
                                 "type": "string",
                                 "const": "dataviz-dark"
                              }
                           ]
                        }
                     },
                     "required": [
                        "tileLayer"
                     ],
                     "additionalProperties": false
                  },
                  "google": {
                     "type": "object",
                     "properties": {
                        "mapType": {
                           "type": "string"
                        }
                     },
                     "additionalProperties": false
                  }
               },
               "additionalProperties": false
            }
         },
         "additionalProperties": false
      },
      "dataLabels": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChart/dataLabels"
      },
      "labels": {
         "type": "object",
         "properties": {
            "showPercent": {
               "type": "boolean"
            },
            "showValue": {
               "type": "boolean"
            },
            "showLabel": {
               "type": "boolean"
            }
         },
         "additionalProperties": false
      },
      "description": {
         "type": "string"
      },
      "textContents": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/"
      },
      "styleDefaults": {
         "type": "object",
         "properties": {
            "lineType": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "none"
                  },
                  {
                     "type": "string",
                     "const": "stepped"
                  },
                  {
                     "type": "string",
                     "const": "curved"
                  },
                  {
                     "type": "string",
                     "const": "straight"
                  },
                  {
                     "type": "string",
                     "const": "centeredStepped"
                  },
                  {
                     "type": "string",
                     "const": "segmented"
                  },
                  {
                     "type": "string",
                     "const": "centerSegmented"
                  },
                  {
                     "type": "string",
                     "const": "centeredSegmented"
                  }
               ]
            },
            "lineWidth": {
               "type": "number"
            },
            "lineStyle": {
               "$ref": "http://oracle.com/bi/lineStyle/0.0.0/"
            },
            "markerDisplayed": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "on"
                  },
                  {
                     "type": "string",
                     "const": "off"
                  }
               ]
            },
            "seriesEffect": {
               "type": "string",
               "const": "color"
            },
            "animationDuration": {
               "type": "string"
            },
            "minorAxis": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMinorMajorAxis"
            },
            "majorAxis": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMinorMajorAxis"
            },
            "nodeDefaults": {
               "anyOf": [
                  {
                     "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/nodeDefaultsHeader"
                  },
                  {
                     "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/nodeDefaultsLabelStyle"
                  }
               ]
            },
            "dataLabelStyle": {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            },
            "stackLabelStyle": {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            },
            "selectionEffect": {
               "type": "string"
            },
            "barGapRatio": {
               "type": "number"
            }
         },
         "additionalProperties": false
      },
      "performanceTile_title_custom_text": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "$ref": "http://oracle.com/bi/caption/0.0.0/"
            }
         ]
      },
      "performanceTile_description_use_value": {
         "anyOf": [
            {
               "type": "string",
               "const": "none"
            },
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "custom"
            }
         ]
      },
      "performanceTile_description_custom_text": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "$ref": "http://oracle.com/bi/caption/0.0.0/"
            }
         ]
      },
      "performanceTile_description_style": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "performanceTile_value_style": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "sparkChartType": {
         "anyOf": [
            {
               "type": "string",
               "const": "none"
            },
            {
               "type": "string",
               "const": "bar"
            },
            {
               "type": "string",
               "const": "area"
            },
            {
               "type": "string",
               "const": "line"
            },
            {
               "type": "string",
               "const": "lineWithArea"
            }
         ]
      },
      "treemapDataValues": {
         "type": "object",
         "properties": {
            "showPercent": {
               "type": "boolean"
            },
            "showValue": {
               "type": "boolean"
            },
            "showLabel": {
               "type": "boolean"
            },
            "percentOfGroup": {
               "type": "boolean"
            }
         },
         "additionalProperties": false
      },
      "pieInnerRadius": {
         "type": "number",
         "minimum": 0
      },
      "piechart_dataLabels": {
         "type": "object",
         "properties": {
            "show_percent": {
               "type": "boolean"
            },
            "show_value": {
               "type": "boolean"
            },
            "show_label": {
               "type": "boolean"
            }
         },
         "required": [
            "show_percent",
            "show_value",
            "show_label"
         ],
         "additionalProperties": false
      },
      "pieCenterLabel": {
         "type": "object",
         "properties": {
            "style": {
               "$ref": "http://oracle.com/bi/style/0.0.0/"
            }
         },
         "required": [
            "style"
         ],
         "additionalProperties": false
      },
      "MthStartValue": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/MthStartValue"
      },
      "dataCursorBehavior": {
         "type": "string",
         "const": "smooth"
      },
      "dataCursor": {
         "anyOf": [
            {
               "type": "string",
               "const": "on"
            },
            {
               "type": "string",
               "const": "off"
            }
         ]
      },
      "points": {
         "type": "object",
         "properties": {
            "size": {
               "type": "integer",
               "minimum": 0,
               "maximum": 255
            },
            "minSize": {
               "type": "integer",
               "minimum": 0,
               "maximum": 255
            },
            "maxSize": {
               "type": "integer",
               "minimum": 0,
               "maximum": 255
            },
            "minSizeOption": {
               "type": "string",
               "const": "custom"
            },
            "outline": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "auto"
                  },
                  {
                     "type": "string",
                     "const": "none"
                  },
                  {
                     "type": "string",
                     "const": "custom"
                  }
               ]
            },
            "outlineColor": {
               "type": "string"
            },
            "lineType": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "none"
                  },
                  {
                     "type": "string",
                     "const": "straight"
                  },
                  {
                     "type": "string",
                     "const": "curved"
                  },
                  {
                     "type": "string",
                     "const": "stepped"
                  },
                  {
                     "type": "string",
                     "const": "segmented"
                  }
               ]
            },
            "fill": {
               "type": "boolean"
            }
         },
         "additionalProperties": false
      },
      "measures": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMeasures"
         }
      },
      "minorAxis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMinorMajorAxis"
      },
      "majorAxis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMinorMajorAxis"
      },
      "orientation": {
         "anyOf": [
            {
               "type": "string",
               "const": "horizontal"
            },
            {
               "type": "string",
               "const": "vertical"
            }
         ]
      },
      "nodeDefaults": {
         "type": "object",
         "properties": {
            "labelStyle": {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            }
         },
         "additionalProperties": false
      },
      "overview": {
         "type": "object",
         "properties": {
            "height": {
               "type": "string"
            },
            "rendered": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "on"
                  },
                  {
                     "type": "string",
                     "const": "off"
                  }
               ]
            }
         },
         "additionalProperties": false
      },
      "unitsPerShape": {
         "type": "integer",
         "minimum": 0,
         "maximum": 4294967295
      },
      "applySizeToStack": {
         "type": "boolean"
      },
      "linkType": {
         "anyOf": [
            {
               "type": "string",
               "const": "none"
            },
            {
               "type": "string",
               "const": "web"
            },
            {
               "type": "string",
               "const": "storypage"
            }
         ]
      },
      "linkAddress": {
         "type": "string"
      },
      "showLabels": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "on"
            },
            {
               "type": "string",
               "const": "off"
            }
         ]
      }
   },
   "unevaluatedProperties": {
      "anyOf": [
         {
            "anyOf": [
               {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/numberFormat"
               },
               {
                  "$ref": "http://oracle.com/bi/workbook/aggRules/0.0.0/"
               }
            ]
         },
         {
            "not": {}
         }
      ]
   }
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizNgperformancetile",
   "type": "object",
   "properties": {
      "sparkChartChartType": {
         "anyOf": [
            {
               "type": "string",
               "const": "bar"
            },
            {
               "type": "string",
               "const": "area"
            },
            {
               "type": "string",
               "const": "line"
            },
            {
               "type": "string",
               "const": "lineWithArea"
            }
         ]
      },
      "sparkChartChartWidth": {
         "anyOf": [
            {
               "type": "string",
               "const": "Auto"
            },
            {
               "type": "string",
               "const": "Medium"
            },
            {
               "type": "string",
               "const": "Small"
            },
            {
               "type": "string",
               "const": "Large"
            },
            {
               "type": "string",
               "const": "Stretch"
            },
            {
               "type": "string",
               "const": "Custom"
            }
         ]
      },
      "sparkChartChartHeight": {
         "anyOf": [
            {
               "type": "string",
               "const": "Auto"
            },
            {
               "type": "string",
               "const": "Medium"
            },
            {
               "type": "string",
               "const": "Small"
            },
            {
               "type": "string",
               "const": "Large"
            },
            {
               "type": "string",
               "const": "Stretch"
            },
            {
               "type": "string",
               "const": "Custom"
            }
         ]
      },
      "sparkChartChartColor": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "valueColorAssignment"
            },
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "sameAsMeasure"
            }
         ]
      },
      "sparkChartChartCustomColor": {
         "type": "string"
      },
      "sparkChartChartCustomWidth": {
         "type": "number",
         "minimum": 0
      },
      "sparkChartChartCustomHeight": {
         "type": "number",
         "minimum": 0
      },
      "sparkChartAlignment": {
         "anyOf": [
            {
               "type": "string",
               "const": "end"
            },
            {
               "type": "string",
               "const": "top"
            },
            {
               "type": "string",
               "const": "bottom"
            }
         ]
      },
      "sparkChartHighLowPoints": {
         "type": "boolean"
      },
      "sparkChartReferenceLine": {
         "anyOf": [
            {
               "type": "string",
               "const": "none"
            },
            {
               "type": "string",
               "const": "average"
            }
         ]
      },
      "sparkChartChartPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "below"
            },
            {
               "type": "string",
               "const": "after"
            }
         ]
      },
      "tileDescriptionUseValue": {
         "anyOf": [
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "none"
            },
            {
               "type": "string",
               "const": "auto"
            }
         ]
      },
      "tileDescriptionCustomValue": {
         "type": "string"
      },
      "tileDescriptionStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "titleStyle": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "tileStyle": {
         "anyOf": [
            {
               "type": "string",
               "const": "top_center"
            },
            {
               "type": "string",
               "const": "top_start"
            },
            {
               "type": "string",
               "const": "top_end"
            },
            {
               "type": "string",
               "const": "center_end"
            },
            {
               "type": "string",
               "const": "center_start"
            },
            {
               "type": "string",
               "const": "center_center"
            },
            {
               "type": "string",
               "const": "bottom_start"
            },
            {
               "type": "string",
               "const": "bottom_end"
            },
            {
               "type": "string",
               "const": "bottom_center"
            }
         ]
      },
      "primaryLabelPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "before"
            },
            {
               "type": "string",
               "const": "after"
            },
            {
               "type": "string",
               "const": "rowAbove"
            },
            {
               "type": "string",
               "const": "rowBelow"
            }
         ]
      },
      "primaryLabelAlignment": {
         "anyOf": [
            {
               "type": "string",
               "const": "start"
            },
            {
               "type": "string",
               "const": "center"
            },
            {
               "type": "string",
               "const": "end"
            }
         ]
      },
      "primaryLabelStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "primaryValueStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "secondaryPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "above"
            },
            {
               "type": "string",
               "const": "below"
            },
            {
               "type": "string",
               "const": "before"
            },
            {
               "type": "string",
               "const": "after"
            }
         ]
      },
      "secondaryOrientation": {
         "anyOf": [
            {
               "type": "string",
               "const": "horizontal"
            },
            {
               "type": "string",
               "const": "vertical"
            }
         ]
      },
      "tileSecondaryLabelsStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "tileSecondaryValuesStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "primaryLabelCustomValue": {
         "type": "string"
      },
      "primaryLabelUseValue": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "none"
            }
         ]
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizNgperformancetileProperties",
   "type": "object",
   "properties": {
      "sparkChartChartType": {
         "anyOf": [
            {
               "type": "string",
               "const": "bar"
            },
            {
               "type": "string",
               "const": "area"
            },
            {
               "type": "string",
               "const": "line"
            },
            {
               "type": "string",
               "const": "lineWithArea"
            }
         ]
      },
      "sparkChartChartWidth": {
         "anyOf": [
            {
               "type": "string",
               "const": "Auto"
            },
            {
               "type": "string",
               "const": "Medium"
            },
            {
               "type": "string",
               "const": "Small"
            },
            {
               "type": "string",
               "const": "Large"
            },
            {
               "type": "string",
               "const": "Stretch"
            },
            {
               "type": "string",
               "const": "Custom"
            }
         ]
      },
      "sparkChartChartHeight": {
         "anyOf": [
            {
               "type": "string",
               "const": "Auto"
            },
            {
               "type": "string",
               "const": "Medium"
            },
            {
               "type": "string",
               "const": "Small"
            },
            {
               "type": "string",
               "const": "Large"
            },
            {
               "type": "string",
               "const": "Stretch"
            },
            {
               "type": "string",
               "const": "Custom"
            }
         ]
      },
      "sparkChartChartColor": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "valueColorAssignment"
            },
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "sameAsMeasure"
            }
         ]
      },
      "sparkChartChartCustomColor": {
         "type": "string"
      },
      "sparkChartChartCustomWidth": {
         "type": "number",
         "minimum": 0
      },
      "sparkChartChartCustomHeight": {
         "type": "number",
         "minimum": 0
      },
      "sparkChartAlignment": {
         "anyOf": [
            {
               "type": "string",
               "const": "end"
            },
            {
               "type": "string",
               "const": "top"
            },
            {
               "type": "string",
               "const": "bottom"
            }
         ]
      },
      "sparkChartHighLowPoints": {
         "type": "boolean"
      },
      "sparkChartReferenceLine": {
         "anyOf": [
            {
               "type": "string",
               "const": "none"
            },
            {
               "type": "string",
               "const": "average"
            }
         ]
      },
      "sparkChartChartPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "below"
            },
            {
               "type": "string",
               "const": "after"
            }
         ]
      },
      "tileDescriptionUseValue": {
         "anyOf": [
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "none"
            },
            {
               "type": "string",
               "const": "auto"
            }
         ]
      },
      "tileDescriptionCustomValue": {
         "type": "string"
      },
      "tileDescriptionStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "titleStyle": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "tileStyle": {
         "anyOf": [
            {
               "type": "string",
               "const": "top_center"
            },
            {
               "type": "string",
               "const": "top_start"
            },
            {
               "type": "string",
               "const": "top_end"
            },
            {
               "type": "string",
               "const": "center_end"
            },
            {
               "type": "string",
               "const": "center_start"
            },
            {
               "type": "string",
               "const": "center_center"
            },
            {
               "type": "string",
               "const": "bottom_start"
            },
            {
               "type": "string",
               "const": "bottom_end"
            },
            {
               "type": "string",
               "const": "bottom_center"
            }
         ]
      },
      "primaryLabelPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "before"
            },
            {
               "type": "string",
               "const": "after"
            },
            {
               "type": "string",
               "const": "rowAbove"
            },
            {
               "type": "string",
               "const": "rowBelow"
            }
         ]
      },
      "primaryLabelAlignment": {
         "anyOf": [
            {
               "type": "string",
               "const": "start"
            },
            {
               "type": "string",
               "const": "center"
            },
            {
               "type": "string",
               "const": "end"
            }
         ]
      },
      "primaryLabelStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "primaryValueStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "secondaryPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "above"
            },
            {
               "type": "string",
               "const": "below"
            },
            {
               "type": "string",
               "const": "before"
            },
            {
               "type": "string",
               "const": "after"
            }
         ]
      },
      "secondaryOrientation": {
         "anyOf": [
            {
               "type": "string",
               "const": "horizontal"
            },
            {
               "type": "string",
               "const": "vertical"
            }
         ]
      },
      "tileSecondaryLabelsStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "tileSecondaryValuesStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "primaryLabelCustomValue": {
         "type": "string"
      },
      "primaryLabelUseValue": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "none"
            }
         ]
      }
   }
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizSankey",
   "type": "object",
   "properties": {
      "dataLabelPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "belowNode"
            },
            {
               "type": "string",
               "const": "innerEdge"
            },
            {
               "type": "string",
               "const": "outerEdge"
            },
            {
               "type": "string",
               "const": "innerEdge"
            },
            {
               "type": "string",
               "const": "aboveNode"
            },
            {
               "type": "string",
               "const": "beforeNode"
            },
            {
               "type": "string",
               "const": "afterNode"
            },
            {
               "type": "string",
               "const": "insideNode"
            }
         ]
      },
      "dataLabel": {
         "anyOf": [
            {
               "type": "string",
               "const": "off"
            },
            {
               "type": "string",
               "const": "inside-node"
            },
            {
               "type": "string",
               "const": "outside-node"
            },
            {
               "type": "string",
               "const": "inner-edge"
            }
         ]
      },
      "nodeHeightType": {
         "anyOf": [
            {
               "type": "string",
               "const": "condense"
            },
            {
               "type": "string",
               "const": "stretch"
            }
         ]
      },
      "nodeWidthType": {
         "anyOf": [
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "auto"
            }
         ]
      },
      "nodeWidthSize": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "nodeWidth": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "nodeGroupByType": {
         "anyOf": [
            {
               "type": "string",
               "const": "byValue"
            },
            {
               "type": "string",
               "const": "byColumn"
            }
         ]
      },
      "nodeGapType": {
         "anyOf": [
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "auto"
            }
         ]
      },
      "nodeGap": {
         "type": "integer",
         "minimum": -32768,
         "maximum": 32767
      },
      "lineTransparencyType": {
         "anyOf": [
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "auto"
            }
         ]
      },
      "lineTransparency": {
         "type": "integer",
         "minimum": -32768,
         "maximum": 32767
      },
      "sortColumnNodes": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "ascending"
            },
            {
               "type": "string",
               "const": "descending"
            },
            {
               "type": "string",
               "const": "nested"
            }
         ]
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizTile",
   "type": "object",
   "properties": {
      "titleStyle": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "tileStyle": {
         "anyOf": [
            {
               "type": "string",
               "const": "top_center"
            },
            {
               "type": "string",
               "const": "top_start"
            },
            {
               "type": "string",
               "const": "top_end"
            },
            {
               "type": "string",
               "const": "center_end"
            },
            {
               "type": "string",
               "const": "center_start"
            },
            {
               "type": "string",
               "const": "center_center"
            },
            {
               "type": "string",
               "const": "bottom_start"
            },
            {
               "type": "string",
               "const": "bottom_end"
            },
            {
               "type": "string",
               "const": "bottom_center"
            }
         ]
      },
      "primaryLabelPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "before"
            },
            {
               "type": "string",
               "const": "after"
            },
            {
               "type": "string",
               "const": "rowAbove"
            },
            {
               "type": "string",
               "const": "rowBelow"
            }
         ]
      },
      "primaryLabelAlignment": {
         "anyOf": [
            {
               "type": "string",
               "const": "start"
            },
            {
               "type": "string",
               "const": "center"
            },
            {
               "type": "string",
               "const": "end"
            }
         ]
      },
      "primaryLabelStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "primaryValueStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "secondaryPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "above"
            },
            {
               "type": "string",
               "const": "below"
            },
            {
               "type": "string",
               "const": "before"
            },
            {
               "type": "string",
               "const": "after"
            }
         ]
      },
      "secondaryOrientation": {
         "anyOf": [
            {
               "type": "string",
               "const": "horizontal"
            },
            {
               "type": "string",
               "const": "vertical"
            }
         ]
      },
      "tileSecondaryLabelsStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "tileSecondaryValuesStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "primaryLabelCustomValue": {
         "type": "string"
      },
      "primaryLabelUseValue": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "none"
            }
         ]
      }
   }
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/waterfall",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "color": {
               "type": "object",
               "properties": {
                  "decreaseColor": {
                     "type": "string"
                  },
                  "increaseColor": {
                     "type": "string"
                  },
                  "startEndColor": {
                     "type": "string"
                  }
               },
               "additionalProperties": false
            },
            "showSubtotal": {
               "type": "boolean"
            },
            "startBarText": {
               "type": "string"
            },
            "xAxis": {
               "type": "object",
               "properties": {
                  "useEndTextValue": {
                     "anyOf": [
                        {
                           "type": "string",
                           "const": "auto"
                        },
                        {
                           "type": "string",
                           "const": "custom"
                        }
                     ]
                  },
                  "endText": {
                     "type": "string"
                  }
               },
               "additionalProperties": false
            }
         },
         "additionalProperties": false
      }
   },
   "required": [
      "settings"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/views",
   "type": "object",
   "properties": {
      "currentView": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewsChildren"
         },
         "minItems": 1
      }
   },
   "required": [
      "currentView",
      "children"
   ],
   "unevaluatedProperties": {
      "$ref": "http://oracle.com/bi/workbook/0.0.0/canvasRootView"
   }
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewsChildren",
   "type": "object",
   "properties": {
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "saw:canvas"
            },
            {
               "type": "string",
               "const": "saw:pluginView"
            }
         ]
      }
   },
   "required": [
      "type"
   ],
   "unevaluatedProperties": {}
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/drillParents",
   "type": "object",
   "properties": {
      "columnID": {
         "type": "string"
      },
      "levelID": {
         "type": "string"
      },
      "members": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/columnOrderQDRMemberChildren"
               }
            },
            "type": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "saw:stringMembers"
                  },
                  {
                     "type": "string",
                     "const": "saw:specialValueMembers"
                  },
                  {
                     "type": "string",
                     "const": "saw:untypedMembers"
                  }
               ]
            }
         },
         "required": [
            "children",
            "type"
         ],
         "additionalProperties": false
      }
   },
   "required": [
      "columnID",
      "levelID",
      "members"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/QDRChildren/hierarchyMembers",
   "type": "object",
   "properties": {
      "hierarchyLevel": {
         "type": "object",
         "properties": {
            "levelID": {
               "type": "string"
            }
         },
         "required": [
            "levelID"
         ],
         "additionalProperties": false
      },
      "members": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "type": "object",
                  "properties": {
                     "text": {
                        "type": "string"
                     }
                  },
                  "required": [
                     "text"
                  ],
                  "additionalProperties": false
               }
            },
            "type": {
               "type": "string",
               "const": "saw:untypedMembers"
            }
         },
         "required": [
            "children",
            "type"
         ],
         "additionalProperties": false
      }
   },
   "required": [
      "hierarchyLevel",
      "members"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/QDRChildren/members",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "type": "object",
            "properties": {
               "text": {
                  "type": "string"
               },
               "specialValue": {
                  "anyOf": [
                     {
                        "type": "string",
                        "const": "all"
                     },
                     {
                        "type": "string",
                        "const": "every"
                     },
                     {
                        "type": "string",
                        "const": "current"
                     },
                     {
                        "type": "string",
                        "const": "any"
                     },
                     {
                        "type": "string",
                        "const": "null"
                     }
                  ]
               }
            },
            "additionalProperties": false
         }
      },
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "saw:stringMembers"
            },
            {
               "type": "string",
               "const": "saw:dateMembers"
            },
            {
               "type": "string",
               "const": "saw:timeMembers"
            },
            {
               "type": "string",
               "const": "saw:dateTimeMembers"
            },
            {
               "type": "string",
               "const": "saw:integerMembers"
            },
            {
               "type": "string",
               "const": "saw:decimalMembers"
            },
            {
               "type": "string",
               "const": "saw:specialValueMembers"
            },
            {
               "type": "string",
               "const": "saw:untypedMembers"
            }
         ]
      }
   },
   "required": [
      "children",
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/selectionGroupsChildren",
   "type": "object",
   "properties": {
      "columnID": {
         "type": "string"
      },
      "groupID": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      }
   },
   "required": [
      "columnID",
      "groupID"
   ]
}];
   return aSchemas;
} );
