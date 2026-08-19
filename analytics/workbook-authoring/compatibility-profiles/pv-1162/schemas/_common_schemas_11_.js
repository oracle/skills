// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfo",
   "type": "object",
   "properties": {
      "nestedVizHeight": {
         "type": "number",
         "minimum": 0
      },
      "nestedVizWidth": {
         "type": "number",
         "minimum": 0
      },
      "relatedSlices": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfoEntry"
         }
      },
      "columns": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfoEntry"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfoEntry",
   "type": "object",
   "properties": {
      "width": {
         "type": "number",
         "minimum": 0
      },
      "height": {
         "type": "number",
         "minimum": 0
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfoTable",
   "type": "object",
   "properties": {
      "nestedVizHeight": {
         "type": "number",
         "minimum": 0
      },
      "relatedSlices": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "number"
         }
      },
      "columns": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "number"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/spacer",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "line": {
               "type": "boolean"
            },
            "color": {
               "type": "string"
            },
            "align": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "center right"
                  },
                  {
                     "type": "string",
                     "const": "left top"
                  },
                  {
                     "type": "string",
                     "const": "center top"
                  },
                  {
                     "type": "string",
                     "const": "center left"
                  },
                  {
                     "type": "string",
                     "const": "center"
                  },
                  {
                     "type": "string",
                     "const": "right top"
                  },
                  {
                     "type": "string",
                     "const": "left bottom"
                  },
                  {
                     "type": "string",
                     "const": "center bottom"
                  },
                  {
                     "type": "string",
                     "const": "right bottom"
                  }
               ]
            },
            "width": {
               "type": "integer",
               "minimum": -2147483648,
               "maximum": 2147483647
            },
            "orientation": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "auto"
                  },
                  {
                     "type": "string",
                     "const": "horizontal"
                  },
                  {
                     "type": "string",
                     "const": "vertical"
                  }
               ]
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/standalonelegend",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "orientation": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "vertical"
                  },
                  {
                     "type": "string",
                     "const": "horizontal"
                  }
               ]
            },
            "alignment": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "center"
                  },
                  {
                     "type": "string",
                     "const": "left top"
                  },
                  {
                     "type": "string",
                     "const": "center top"
                  },
                  {
                     "type": "string",
                     "const": "right top"
                  },
                  {
                     "type": "string",
                     "const": "center left"
                  },
                  {
                     "type": "string",
                     "const": "center right"
                  },
                  {
                     "type": "string",
                     "const": "left bottom"
                  },
                  {
                     "type": "string",
                     "const": "center bottom"
                  },
                  {
                     "type": "string",
                     "const": "right bottom"
                  }
               ]
            }
         },
         "required": [
            "orientation",
            "alignment"
         ],
         "additionalProperties": false
      }
   },
   "required": [
      "settings"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/table",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "groupRows": {
               "type": "boolean"
            },
            "duplicateRows": {
               "type": "boolean"
            },
            "sizeInfo": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfoTable"
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChart",
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
      }
   },
   "unevaluatedProperties": {
      "anyOf": [
         {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/numberFormat"
         },
         {
            "$ref": "http://oracle.com/bi/workbook/aggRules/0.0.0/"
         }
      ]
   }
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis",
   "type": "object",
   "properties": {
      "minoption": {
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
               "const": "minData"
            }
         ]
      },
      "maxoption": {
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
               "const": "maxData"
            }
         ]
      },
      "min": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "number"
            }
         ]
      },
      "max": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "number"
            }
         ]
      },
      "viewportMin": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "number"
            }
         ]
      },
      "viewportMax": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "number"
            }
         ]
      },
      "minauto": {
         "type": "boolean"
      },
      "maxauto": {
         "type": "boolean"
      },
      "syncScales": {
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
      "titleInput": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "string"
            }
         ]
      },
      "title": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "string"
            }
         ]
      },
      "titleStyle": {
         "type": "object",
         "properties": {
            "fontWeight": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "normal"
                  },
                  {
                     "type": "string",
                     "const": "bold"
                  }
               ]
            },
            "fontFamily": {
               "type": "string"
            },
            "fontSize": {
               "type": "string"
            },
            "fontStyle": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "normal"
                  },
                  {
                     "type": "string",
                     "const": "bold"
                  },
                  {
                     "type": "string",
                     "const": "italic"
                  }
               ]
            },
            "textDecoration": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "none"
                  },
                  {
                     "type": "string",
                     "const": "underline"
                  }
               ]
            },
            "color": {
               "type": "string"
            },
            "textAlign": {
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
                  },
                  {
                     "type": "null"
                  }
               ]
            },
            "font": {
               "$ref": "http://oracle.com/bi/font/0.0.0/"
            }
         },
         "additionalProperties": false
      },
      "rendered": {
         "type": "string",
         "const": "off"
      },
      "scale": {
         "anyOf": [
            {
               "type": "string",
               "const": "log"
            },
            {
               "type": "string",
               "const": "linear"
            }
         ]
      },
      "useTitleValue": {
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
      "format": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/numberFormat"
      },
      "majorTick": {
         "type": "object",
         "properties": {
            "rendered": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "on"
                  },
                  {
                     "type": "string",
                     "const": "off"
                  },
                  {
                     "type": "string",
                     "const": "auto"
                  }
               ]
            }
         },
         "required": [
            "rendered"
         ],
         "additionalProperties": false
      },
      "minorTick": {
         "type": "object",
         "properties": {
            "rendered": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "on"
                  },
                  {
                     "type": "string",
                     "const": "off"
                  },
                  {
                     "type": "string",
                     "const": "auto"
                  }
               ]
            }
         },
         "required": [
            "rendered"
         ],
         "additionalProperties": false
      },
      "tickLabel": {
         "type": "object",
         "properties": {
            "rendered": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "on"
                  },
                  {
                     "type": "string",
                     "const": "off"
                  },
                  {
                     "type": "string",
                     "const": "auto"
                  }
               ]
            },
            "style": {
               "type": "object",
               "properties": {
                  "fontWeight": {
                     "anyOf": [
                        {
                           "type": "string",
                           "const": "normal"
                        },
                        {
                           "type": "string",
                           "const": "bold"
                        }
                     ]
                  },
                  "fontFamily": {
                     "type": "string"
                  },
                  "fontSize": {
                     "type": "string"
                  },
                  "fontStyle": {
                     "anyOf": [
                        {
                           "type": "string",
                           "const": "normal"
                        },
                        {
                           "type": "string",
                           "const": "bold"
                        },
                        {
                           "type": "string",
                           "const": "italic"
                        }
                     ]
                  },
                  "textDecoration": {
                     "anyOf": [
                        {
                           "type": "string",
                           "const": "none"
                        },
                        {
                           "type": "string",
                           "const": "underline"
                        }
                     ]
                  },
                  "color": {
                     "type": "string"
                  },
                  "textAlign": {
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
                        },
                        {
                           "type": "null"
                        }
                     ]
                  },
                  "font": {
                     "$ref": "http://oracle.com/bi/font/0.0.0/"
                  }
               },
               "additionalProperties": false
            }
         },
         "additionalProperties": false
      },
      "axisLine": {
         "type": "object",
         "properties": {
            "rendered": {
               "type": "string",
               "const": "off"
            }
         },
         "additionalProperties": false
      },
      "referenceObjects": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis/referenceObjects"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis/referenceObjects",
   "type": "object",
   "properties": {
      "_function": {
         "anyOf": [
            {
               "type": "string",
               "const": "avg"
            },
            {
               "type": "string",
               "const": "max"
            }
         ]
      },
      "_functionFrom": {
         "type": "string",
         "const": "min"
      },
      "_functionTo": {
         "type": "string",
         "const": "max"
      },
      "_id": {
         "type": "string"
      },
      "_measureId": {
         "type": "string"
      },
      "_trellisScope": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/trellisScope"
      },
      "_type": {
         "type": "string",
         "const": "reference"
      },
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "area"
            },
            {
               "type": "string",
               "const": "line"
            }
         ]
      }
   },
   "required": [
      "_function",
      "_functionFrom",
      "_functionTo",
      "_id",
      "_measureId",
      "_trellisScope",
      "_type",
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChart/dataLabels",
   "type": "object",
   "properties": {
      "applyToAllMeasures": {
         "type": "object",
         "properties": {
            "position": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "auto"
                  },
                  {
                     "type": "string",
                     "const": "aboveMarker"
                  },
                  {
                     "type": "string",
                     "const": "belowMarker"
                  },
                  {
                     "type": "string",
                     "const": "beforeMarker"
                  },
                  {
                     "type": "string",
                     "const": "afterMarker"
                  },
                  {
                     "type": "string",
                     "const": "center"
                  },
                  {
                     "type": "string",
                     "const": "outsideBarEdge"
                  }
               ]
            },
            "style": {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            },
            "off": {
               "type": "boolean"
            },
            "displayOption": {
               "type": "string",
               "const": "variation"
            }
         },
         "additionalProperties": false
      },
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
      },
      "measures": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartDataLabelMeasures"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartDataLabelMeasures",
   "type": "object",
   "properties": {
      "position": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "outsideBarEdge"
            },
            {
               "type": "string",
               "const": "aboveMarker"
            },
            {
               "type": "string",
               "const": "belowMarker"
            },
            {
               "type": "string",
               "const": "afterMarker"
            },
            {
               "type": "string",
               "const": "center"
            },
            {
               "type": "string",
               "const": "insideBarEdge"
            }
         ]
      },
      "style": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      }
   },
   "required": [
      "position"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChart/legend",
   "type": "object",
   "properties": {
      "rendered": {
         "anyOf": [
            {
               "type": "null"
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
      },
      "position": {
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
               "const": "start"
            },
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
      "title": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "string"
            }
         ]
      },
      "titleInput": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "string"
            }
         ]
      },
      "titleStyle": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "textStyle": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "useTitles": {
         "anyOf": [
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
      "customTitles": {
         "type": "object",
         "properties": {
            "colorvaluelabels": {
               "anyOf": [
                  {
                     "type": "null"
                  },
                  {
                     "type": "string"
                  }
               ]
            },
            "color": {
               "type": "string"
            },
            "size": {
               "type": "string"
            },
            "glyph": {
               "type": "string"
            }
         },
         "additionalProperties": false
      },
      "sectionVisibility": {
         "anyOf": [
            {
               "type": "string",
               "const": "on"
            },
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "moreThanOneItem"
            }
         ]
      },
      "_showContinuousColorForAllMeasures": {
         "type": "boolean"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMeasures",
   "type": "object",
   "properties": {
      "lineStyle": {
         "$ref": "http://oracle.com/bi/lineStyle/0.0.0/"
      },
      "transparency": {
         "type": "number",
         "minimum": 0
      },
      "lineWidth": {
         "type": "number",
         "minimum": 0
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMinorMajorAxis",
   "type": "object",
   "properties": {
      "scale": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "seconds"
            },
            {
               "type": "string",
               "const": "minutes"
            },
            {
               "type": "string",
               "const": "hours"
            },
            {
               "type": "string",
               "const": "weeks"
            },
            {
               "type": "string",
               "const": "days"
            },
            {
               "type": "string",
               "const": "months"
            },
            {
               "type": "string",
               "const": "quarters"
            },
            {
               "type": "string",
               "const": "years"
            }
         ]
      },
      "labelStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizColumn",
   "type": "object",
   "properties": {
      "columnID": {
         "type": "string"
      },
      "type": {
         "type": "string",
         "const": "saw:regularColumn"
      },
      "columnFormula": {
         "$ref": "http://oracle.com/bi/formula/0.0.0/"
      },
      "advancedAnalyticsType": {
         "$ref": "http://oracle.com/bi/advancedAnalyticsType/0.0.0/"
      },
      "columnHeading": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/"
      }
   },
   "required": [
      "columnID",
      "type",
      "columnFormula"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizCommon",
   "type": "object",
   "properties": {
      "conditionalFormatting": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/conditionalFormatting"
      },
      "bIncludeValueLabelsInColor": {
         "type": "boolean"
      },
      "isAutoViewSuggestEnabled": {
         "anyOf": [
            {
               "type": "string",
               "const": "true"
            },
            {
               "type": "string",
               "const": "false"
            }
         ]
      },
      "showVizFilters": {
         "type": "boolean"
      },
      "style": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "customTooltip": {
         "type": "string"
      },
      "showDefaultTooltip": {
         "type": "boolean"
      },
      "showFilterToggle": {
         "type": "boolean"
      },
      "filterStyles": {
         "type": "object",
         "properties": {
            "titles": {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            },
            "selections": {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            }
         },
         "additionalProperties": false
      },
      "visualizationInsightsEnabled": {
         "type": "boolean"
      },
      "showHideCondition": {
         "anyOf": [
            {
               "type": "boolean"
            },
            {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/hideCondition"
            }
         ]
      },
      "customTooltipLayers": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "string"
         }
      },
      "trackingInfo": {
         "type": "object",
         "properties": {
            "autoInsights": {
               "anyOf": [
                  {
                     "type": "boolean"
                  },
                  {
                     "type": "string"
                  }
               ]
            }
         },
         "additionalProperties": false
      },
      "toolbarPosition": {
         "type": "object",
         "properties": {
            "value": {
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
                     "const": "center"
                  },
                  {
                     "type": "string",
                     "const": "right"
                  }
               ]
            }
         },
         "additionalProperties": false
      },
      "relatedColumnConditionCache": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "boolean"
         }
      },
      "excludeAutoRefresh": {
         "type": "boolean"
      },
      "requestVariableParameterBindings": {
         "type": "array",
         "items": {
            "type": "object",
            "properties": {
               "sParameterName": {
                  "type": "string"
               },
               "sRequestVariableName": {
                  "type": "string"
               }
            },
            "required": [
               "sParameterName",
               "sRequestVariableName"
            ]
         }
      },
      "columnSwap": {
         "type": "boolean"
      },
      "useInColumnSwapping": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "boolean"
         }
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizCommonProperties",
   "type": "object",
   "properties": {
      "conditionalFormatting": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/conditionalFormatting"
      },
      "bIncludeValueLabelsInColor": {
         "type": "boolean"
      },
      "isAutoViewSuggestEnabled": {
         "anyOf": [
            {
               "type": "string",
               "const": "true"
            },
            {
               "type": "string",
               "const": "false"
            }
         ]
      },
      "showVizFilters": {
         "type": "boolean"
      },
      "style": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "customTooltip": {
         "type": "string"
      },
      "showDefaultTooltip": {
         "type": "boolean"
      },
      "showFilterToggle": {
         "type": "boolean"
      },
      "filterStyles": {
         "type": "object",
         "properties": {
            "titles": {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            },
            "selections": {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            }
         },
         "additionalProperties": false
      },
      "visualizationInsightsEnabled": {
         "type": "boolean"
      },
      "showHideCondition": {
         "anyOf": [
            {
               "type": "boolean"
            },
            {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/hideCondition"
            }
         ]
      },
      "customTooltipLayers": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "string"
         }
      },
      "trackingInfo": {
         "type": "object",
         "properties": {
            "autoInsights": {
               "anyOf": [
                  {
                     "type": "boolean"
                  },
                  {
                     "type": "string"
                  }
               ]
            }
         },
         "additionalProperties": false
      },
      "toolbarPosition": {
         "type": "object",
         "properties": {
            "value": {
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
                     "const": "center"
                  },
                  {
                     "type": "string",
                     "const": "right"
                  }
               ]
            }
         },
         "additionalProperties": false
      },
      "relatedColumnConditionCache": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "boolean"
         }
      },
      "excludeAutoRefresh": {
         "type": "boolean"
      },
      "requestVariableParameterBindings": {
         "type": "array",
         "items": {
            "type": "object",
            "properties": {
               "sParameterName": {
                  "type": "string"
               },
               "sRequestVariableName": {
                  "type": "string"
               }
            },
            "required": [
               "sParameterName",
               "sRequestVariableName"
            ]
         }
      },
      "columnSwap": {
         "type": "boolean"
      },
      "useInColumnSwapping": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "boolean"
         }
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizDataBlending",
   "type": "object",
   "properties": {
      "XSA_ROLES": {
         "type": "object",
         "properties": {
            "HUB": {
               "type": "array",
               "items": {
                  "type": "string"
               }
            }
         },
         "required": [
            "HUB"
         ],
         "additionalProperties": false
      }
   },
   "required": [
      "XSA_ROLES"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizFilter",
   "type": "object",
   "properties": {
      "filterIDMap": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "string"
         }
      },
      "generatedBy": {
         "type": "string",
         "const": "filterMigration"
      },
      "style": {
         "anyOf": [
            {
               "type": "string",
               "const": "standard"
            },
            {
               "type": "string",
               "const": "filterChip"
            },
            {
               "type": "string",
               "const": "minimal"
            }
         ]
      },
      "showValues": {
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
      "showCaption": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "string"
         }
      },
      "captionMap": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/caption/0.0.0/"
         }
      },
      "captionLocation": {
         "anyOf": [
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
               "const": "above"
            }
         ]
      },
      "captionFont": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "align": {
         "anyOf": [
            {
               "type": "string",
               "const": "left top"
            },
            {
               "type": "string",
               "const": "center top"
            },
            {
               "type": "string",
               "const": "right top"
            },
            {
               "type": "string",
               "const": "center left"
            },
            {
               "type": "string",
               "const": "center"
            },
            {
               "type": "string",
               "const": "center right"
            },
            {
               "type": "string",
               "const": "left bottom"
            },
            {
               "type": "string",
               "const": "center bottom"
            },
            {
               "type": "string",
               "const": "right bottom"
            }
         ]
      },
      "controlStyle": {
         "type": "object",
         "properties": {
            "type": {
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
            "color": {
               "type": "string"
            },
            "colorTransparency": {
               "type": "integer",
               "minimum": 0,
               "maximum": 255
            },
            "outline": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "visible"
                  },
                  {
                     "type": "string",
                     "const": "none"
                  }
               ]
            }
         },
         "required": [
            "type"
         ],
         "additionalProperties": false
      },
      "comboTextMaxWidthOption": {
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
               "const": "fill"
            }
         ]
      },
      "comboTextCustomWidth": {
         "type": "number",
         "minimum": 121
      },
      "comboTextFont": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "sliderPlayOption": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "boolean"
         }
      },
      "sliderLabelFont": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/font/0.0.0/object"
         }
      },
      "sliderValueFont": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/font/0.0.0/object"
         }
      },
      "defaultValueOption": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "string"
         }
      },
      "defaultValueCustom": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "string"
         }
      },
      "valuesSelection": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "anyOf": [
               {
                  "type": "string",
                  "const": "single"
               },
               {
                  "type": "string",
                  "const": "multiple"
               }
            ]
         }
      },
      "filterLayout": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
            },
            {
               "type": "string",
               "const": "vertical"
            },
            {
               "type": "string",
               "const": "horizontal"
            }
         ]
      },
      "filterLayoutWrap": {
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
      "filterButtons": {
         "type": "array",
         "items": {
            "type": "string"
         }
      },
      "freezeFilterButtons": {
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
      "parameterIDMap": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "string"
         }
      },
      "parameterControlTypeMap": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "string"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGrid",
   "type": "object",
   "properties": {
      "customTotalsLabel": {
         "type": "object",
         "properties": {
            "row": {
               "type": "object",
               "properties": {
                  "sLabelValue": {
                     "type": "string"
                  }
               },
               "unevaluatedProperties": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridGrandTotalLabel"
               }
            },
            "column": {
               "type": "object",
               "properties": {
                  "sLabelValue": {
                     "type": "string"
                  }
               },
               "unevaluatedProperties": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridGrandTotalLabel"
               }
            }
         }
      },
      "labelStyles": {
         "type": "object",
         "properties": {
            "default": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridStyle"
            },
            "columns": {
               "type": "object",
               "properties": {},
               "unevaluatedProperties": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridStyle"
               }
            },
            "edges": {
               "type": "object",
               "properties": {
                  "row": {
                     "type": "object",
                     "properties": {
                        "grandTotals": {
                           "type": "object",
                           "properties": {
                              "font": {
                                 "$ref": "http://oracle.com/bi/font/0.0.0/"
                              },
                              "background": {
                                 "$ref": "http://oracle.com/bi/background/0.0.0/"
                              }
                           },
                           "required": [
                              "font"
                           ],
                           "additionalProperties": false
                        }
                     },
                     "required": [
                        "grandTotals"
                     ],
                     "additionalProperties": false
                  },
                  "column": {
                     "type": "object",
                     "properties": {
                        "grandTotals": {
                           "type": "object",
                           "properties": {
                              "font": {
                                 "$ref": "http://oracle.com/bi/font/0.0.0/"
                              },
                              "background": {
                                 "$ref": "http://oracle.com/bi/background/0.0.0/"
                              }
                           },
                           "required": [
                              "font"
                           ],
                           "additionalProperties": false
                        }
                     },
                     "required": [
                        "grandTotals"
                     ],
                     "additionalProperties": false
                  }
               },
               "additionalProperties": false
            }
         },
         "additionalProperties": false
      },
      "frozenGrandTotal": {
         "type": "object",
         "properties": {
            "row": {
               "type": "boolean"
            }
         },
         "additionalProperties": false
      },
      "wrapText": {
         "type": "boolean"
      },
      "align": {
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
      "memberFormat": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridMemberFormat"
         }
      },
      "rowHeaderOrientation": {
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
      "sizeInfo": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfo"
            }
         ]
      }
   },
   "unevaluatedProperties": {
      "anyOf": [
         {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/headerProperties"
         },
         {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/displayAsLinkSettings"
         }
      ]
   }
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridGrandTotalLabel",
   "type": "object",
   "properties": {
      "sLabelValue": {
         "type": "string"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridMemberFormat",
   "type": "object",
   "properties": {
      "wrapText": {
         "type": "boolean"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridProperties",
   "type": "object",
   "properties": {
      "customTotalsLabel": {
         "type": "object",
         "properties": {
            "row": {
               "type": "object",
               "properties": {
                  "sLabelValue": {
                     "type": "string"
                  }
               },
               "unevaluatedProperties": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridGrandTotalLabel"
               }
            },
            "column": {
               "type": "object",
               "properties": {
                  "sLabelValue": {
                     "type": "string"
                  }
               },
               "unevaluatedProperties": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridGrandTotalLabel"
               }
            }
         }
      },
      "labelStyles": {
         "type": "object",
         "properties": {
            "default": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridStyle"
            },
            "columns": {
               "type": "object",
               "properties": {},
               "unevaluatedProperties": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridStyle"
               }
            },
            "edges": {
               "type": "object",
               "properties": {
                  "row": {
                     "type": "object",
                     "properties": {
                        "grandTotals": {
                           "type": "object",
                           "properties": {
                              "font": {
                                 "$ref": "http://oracle.com/bi/font/0.0.0/"
                              },
                              "background": {
                                 "$ref": "http://oracle.com/bi/background/0.0.0/"
                              }
                           },
                           "required": [
                              "font"
                           ],
                           "additionalProperties": false
                        }
                     },
                     "required": [
                        "grandTotals"
                     ],
                     "additionalProperties": false
                  },
                  "column": {
                     "type": "object",
                     "properties": {
                        "grandTotals": {
                           "type": "object",
                           "properties": {
                              "font": {
                                 "$ref": "http://oracle.com/bi/font/0.0.0/"
                              },
                              "background": {
                                 "$ref": "http://oracle.com/bi/background/0.0.0/"
                              }
                           },
                           "required": [
                              "font"
                           ],
                           "additionalProperties": false
                        }
                     },
                     "required": [
                        "grandTotals"
                     ],
                     "additionalProperties": false
                  }
               },
               "additionalProperties": false
            }
         },
         "additionalProperties": false
      },
      "frozenGrandTotal": {
         "type": "object",
         "properties": {
            "row": {
               "type": "boolean"
            }
         },
         "additionalProperties": false
      },
      "wrapText": {
         "type": "boolean"
      },
      "align": {
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
      "memberFormat": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridMemberFormat"
         }
      },
      "rowHeaderOrientation": {
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
      "sizeInfo": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfo"
            }
         ]
      }
   },
   "description": "Base Viz_Grid_Properties model:\n- Contains base properties of 'viz:grid' configuration.\n- Does NOT capture AdditionalProperties<T>."
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGridStyle",
   "type": "object",
   "properties": {
      "header": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "totals": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "data": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "headerData": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizMapViewport",
   "type": "object",
   "properties": {
      "scale": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "number"
            }
         ]
      },
      "center": {
         "type": "object",
         "properties": {
            "x": {
               "type": "number"
            },
            "y": {
               "type": "number"
            },
            "srid": {
               "type": "integer",
               "minimum": 0,
               "maximum": 4294967295
            }
         },
         "required": [
            "x",
            "y",
            "srid"
         ],
         "additionalProperties": false
      },
      "device": {
         "type": "object",
         "properties": {
            "width": {
               "type": "number"
            },
            "height": {
               "type": "number"
            }
         },
         "required": [
            "width",
            "height"
         ],
         "additionalProperties": false
      },
      "mapBounds": {
         "type": "object",
         "properties": {
            "minLongitude": {
               "type": "number"
            },
            "minLatitude": {
               "type": "number"
            },
            "maxLongitude": {
               "type": "number"
            },
            "maxLatitude": {
               "type": "number"
            },
            "srid": {
               "type": "integer",
               "minimum": 0,
               "maximum": 4294967295
            }
         },
         "required": [
            "minLongitude",
            "minLatitude",
            "maxLongitude",
            "maxLatitude",
            "srid"
         ],
         "additionalProperties": false
      }
   },
   "required": [
      "scale",
      "center",
      "device",
      "mapBounds"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
