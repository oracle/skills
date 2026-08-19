// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storyConfigSettings",
   "type": "object",
   "properties": {
      "filters": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesFilters"
      },
      "letterboxAlignment": {
         "anyOf": [
            {
               "type": "string",
               "const": "center"
            },
            {
               "type": "string",
               "const": "center top"
            },
            {
               "type": "string",
               "const": "left top"
            }
         ]
      },
      "header": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesHeader"
      },
      "zoomPropertyBag": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesZoom"
      },
      "personalization": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesPersonalization"
      },
      "bPresentationFullyInteractive": {
         "type": "boolean"
      },
      "applicationToolbar": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesApplicationToolBar"
      },
      "visualizationActions": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesVisualizationAction"
      },
      "insightsPanel": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesInsightsPanel"
      },
      "mobileExperience": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesMobileExperience"
      },
      "_useLegacyFilterBarMerge": {
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
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storyPageConfigSettings",
   "type": "object",
   "properties": {
      "filters": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesFilters"
      },
      "zoomPropertyBag": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storyPageZoom"
      },
      "visualizationActions": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesVisualizationAction"
      },
      "visualizationMenu": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesVisualizationMenu"
      },
      "storypage:header": {
         "type": "object",
         "properties": {
            "showTitle": {
               "type": "boolean"
            },
            "showDescription": {
               "type": "boolean"
            }
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storyPageZoom",
   "type": "object",
   "properties": {
      "zoomScale": {
         "type": "string"
      },
      "showZoomContentControl": {
         "type": "boolean"
      },
      "overrideMode": {
         "$ref": "http://oracle.com/bi/workbook/overrideMode/0.0.0/"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/themeFont/0.0.0/",
   "type": "object",
   "properties": {
      "type": {
         "type": "string",
         "const": "custom"
      },
      "primaryColor": {
         "type": "string"
      },
      "secondaryColor": {
         "type": "string"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/VariableParameterBindingsSettings",
   "type": "object",
   "properties": {
      "sRequestVariableName": {
         "type": "string"
      },
      "sParameterName": {
         "type": "string"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings",
   "type": "object",
   "properties": {
      "obitech-autoviz/autoviz": {
         "type": "object",
         "properties": {
            "innerPluginType": {
               "type": "string"
            }
         },
         "required": [
            "innerPluginType"
         ],
         "additionalProperties": false
      },
      "viz:chart": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChart"
      },
      "viz:common": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizCommon"
      },
      "viz:columns": {
         "type": "object",
         "properties": {
            "columns": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizColumn"
               }
            }
         },
         "required": [
            "columns"
         ],
         "additionalProperties": false
      },
      "viz:barlineareachart": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/barlineAreaChart"
      },
      "viz:advancedanalytics": {
         "type": "object",
         "properties": {
            "_advancedAnalytics": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/advancedAnalytics"
               }
            }
         },
         "required": [
            "_advancedAnalytics"
         ],
         "additionalProperties": false
      },
      "viz:filter": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizFilter"
      },
      "viz:grid": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizGrid"
      },
      "viz:sankeychart": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizSankey"
      },
      "viz:datablending": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizDataBlending"
      },
      "containerProperties": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/containerProperties"
      },
      "format": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/format"
         }
      },
      "oracle.bi.tech.table": {
         "type": "object",
         "properties": {}
      },
      "oracle.bi.tech.pivot": {
         "type": "object",
         "properties": {}
      },
      "oracle.bi.tech.canvassummaryviz": {
         "type": "object",
         "properties": {}
      },
      "oracle.bi.tech.buttonbar": {
         "type": "object",
         "properties": {}
      },
      "oracle.bi.tech.chart.comboMultiLayerChart": {
         "type": "object",
         "properties": {}
      },
      "oracle.bi.tech.ganttchart": {
         "type": "object",
         "properties": {}
      },
      "oracle.bi.tech.parallelcoordinates": {
         "type": "object",
         "properties": {}
      },
      "oracle.bi.tech.chart.standaloneLegend": {
         "type": "object",
         "properties": {}
      },
      "oracle.bi.tech.gauge": {
         "type": "object",
         "properties": {}
      },
      "oracle.bi.tech.chart.waterfall": {
         "type": "object",
         "properties": {}
      },
      "viz:narrative": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizNarrative"
      },
      "viz:ngperformancetile": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizNgperformancetile"
      },
      "oracle.bi.tech.spacer": {
         "type": "object",
         "properties": {}
      },
      "viz:networkchart": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizNetworkchart"
      }
   }
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/advancedAnalytics",
   "type": "object",
   "properties": {
      "id": {
         "type": "string"
      },
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "line"
            },
            {
               "type": "string",
               "const": "area"
            }
         ]
      },
      "_type": {
         "anyOf": [
            {
               "type": "string",
               "const": "trend"
            },
            {
               "type": "string",
               "const": "forecast"
            },
            {
               "type": "string",
               "const": "reference"
            }
         ]
      },
      "_columnId": {
         "type": "string"
      },
      "_columnValueParameter": {
         "type": "string"
      },
      "_columnValueFromParameter": {
         "type": "string"
      },
      "_columnValueToParameter": {
         "type": "string"
      },
      "_function": {
         "anyOf": [
            {
               "type": "string",
               "const": "avg"
            },
            {
               "type": "string",
               "const": "stdDev"
            },
            {
               "type": "string",
               "const": "median"
            }
         ]
      },
      "_method": {
         "anyOf": [
            {
               "type": "string",
               "const": "LINEAR"
            },
            {
               "type": "string",
               "const": "POLYNOMIAL"
            },
            {
               "type": "string",
               "const": "EXPONENTIAL"
            },
            {
               "type": "string",
               "const": "next"
            }
         ]
      },
      "_degree": {
         "type": "integer"
      },
      "_vizId": {
         "type": "string"
      },
      "_name": {
         "type": "string"
      },
      "_trellisScope": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/trellisScope"
      },
      "lineStyle": {
         "$ref": "http://oracle.com/bi/lineStyle/0.0.0/"
      },
      "line": {
         "type": "object",
         "properties": {
            "function": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "constant"
                  },
                  {
                     "type": "string",
                     "const": "median"
                  },
                  {
                     "type": "string",
                     "const": "min"
                  },
                  {
                     "type": "string",
                     "const": "max"
                  },
                  {
                     "type": "string",
                     "const": "topN"
                  },
                  {
                     "type": "string",
                     "const": "bottomN"
                  },
                  {
                     "type": "string",
                     "const": "percentile"
                  }
               ]
            },
            "constant": {
               "type": "number"
            },
            "topN": {
               "type": "number"
            },
            "bottomN": {
               "type": "number"
            },
            "percentile": {
               "type": "number",
               "minimum": 0,
               "maximum": 100
            }
         },
         "required": [
            "function"
         ],
         "additionalProperties": false
      },
      "lineWidth": {
         "type": "number"
      },
      "_periods": {
         "type": "integer"
      },
      "_model": {
         "anyOf": [
            {
               "type": "string",
               "const": "arima"
            },
            {
               "type": "string",
               "const": "seasonalArima"
            },
            {
               "type": "string",
               "const": "ets"
            },
            {
               "type": "string",
               "const": "prophet"
            }
         ]
      },
      "_predictionInterval": {
         "type": "string"
      },
      "_confInt": {
         "type": "string"
      },
      "_columnValue": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "integer"
            }
         ]
      },
      "_columnValueFrom": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "integer"
            }
         ]
      },
      "_columnValueTo": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "integer"
            }
         ]
      },
      "_columnValueToOption": {
         "type": "string"
      },
      "_columnValueToPeriods": {
         "type": "integer"
      },
      "_columnValueToPeriodsParameter": {
         "type": "string"
      },
      "_columnValueToPeriod": {
         "type": "string"
      },
      "bShowRefObject": {
         "type": "boolean"
      },
      "location": {
         "type": "string",
         "const": "front"
      },
      "_color": {
         "type": "string"
      },
      "_transparency": {
         "type": "integer",
         "minimum": 0,
         "maximum": 255
      },
      "bandEnd": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/advancedAnalytics/band"
      },
      "bandStart": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/advancedAnalytics/band"
      }
   },
   "required": [
      "id",
      "type",
      "_type",
      "_trellisScope"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/advancedAnalytics/band",
   "type": "object",
   "properties": {
      "function": {
         "anyOf": [
            {
               "type": "string",
               "const": "avg"
            },
            {
               "type": "string",
               "const": "constant"
            },
            {
               "type": "string",
               "const": "stdDev"
            },
            {
               "type": "string",
               "const": "topN"
            },
            {
               "type": "string",
               "const": "bottomN"
            },
            {
               "type": "string",
               "const": "percentile"
            },
            {
               "type": "string",
               "const": "median"
            }
         ]
      },
      "percentile": {
         "type": "number",
         "minimum": 0,
         "maximum": 100
      },
      "constant": {
         "type": "number"
      },
      "bottomN": {
         "type": "number"
      },
      "topN": {
         "type": "number"
      },
      "stdDev": {
         "type": "number",
         "minimum": 0
      }
   },
   "required": [
      "function"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/barlineAreaChart",
   "type": "object",
   "properties": {
      "measureInfos": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/barlineAreaChart/measureInfo"
         }
      }
   },
   "required": [
      "measureInfos"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/barlineAreaChart/measureInfo",
   "type": "object",
   "properties": {
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "bar"
            },
            {
               "type": "string",
               "const": "line"
            },
            {
               "type": "string",
               "const": "area"
            },
            {
               "type": "string",
               "const": "scatter"
            }
         ]
      },
      "assignedToY2": {
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
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "buttonConfig": {
               "type": "object",
               "properties": {
                  "buttonOptions": {
                     "type": "object",
                     "properties": {},
                     "unevaluatedProperties": {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/ButtonOptions"
                     }
                  },
                  "nNextButtonIndex": {
                     "type": "integer"
                  },
                  "buttonStyle": {
                     "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/ButtonStyles"
                  },
                  "buttonBackgroundStyle": {
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
                  "backgroundColor": {
                     "type": "string"
                  },
                  "spacingType": {
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
                  "spacing": {
                     "type": "integer"
                  },
                  "width": {
                     "type": "integer"
                  },
                  "widthType": {
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
                  "height": {
                     "type": "integer"
                  },
                  "heightType": {
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
                  "backgroundColorTransparency": {
                     "type": "integer"
                  },
                  "customLabelStyles": {
                     "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/CustomLabelStyles"
                  },
                  "graphicLocation": {
                     "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/GraphicLocationOptions"
                  },
                  "graphicSizeType": {
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
                  "graphicSize": {
                     "type": "integer"
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
                  "orientation": {
                     "anyOf": [
                        {
                           "type": "string",
                           "const": "horizontal"
                        },
                        {
                           "type": "string",
                           "const": "vertical"
                        },
                        {
                           "type": "string",
                           "const": "auto"
                        }
                     ]
                  },
                  "wrap": {
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
            }
         },
         "required": [
            "buttonConfig"
         ]
      }
   },
   "required": [
      "settings"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/canvassummaryviz",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "titleFont": {
               "$ref": "http://oracle.com/bi/font/0.0.0/"
            },
            "summaryFont": {
               "$ref": "http://oracle.com/bi/font/0.0.0/"
            },
            "viewTitleFont": {
               "$ref": "http://oracle.com/bi/font/0.0.0/"
            },
            "viewSummaryFont": {
               "$ref": "http://oracle.com/bi/font/0.0.0/"
            },
            "showViewDescriptions": {
               "type": "boolean"
            },
            "tone": {
               "type": "string"
            },
            "question": {
               "type": "string"
            },
            "_currentSummaryCacheID": {
               "type": "string"
            },
            "_currentSummaryCacheResult": {
               "type": "string"
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "dataLayersInfo": {
               "type": "object",
               "properties": {},
               "unevaluatedProperties": {
                  "anyOf": [
                     {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart/dataLayersInfoEnum"
                     },
                     {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart/dataLayersInfo"
                     }
                  ]
               }
            }
         },
         "required": [
            "dataLayersInfo"
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart/dataLayersInfo",
   "type": "object",
   "properties": {
      "type": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart/dataLayersInfoEnum"
      },
      "lineStyle": {
         "$ref": "http://oracle.com/bi/lineStyle/0.0.0/"
      },
      "customTooltip": {
         "type": "string"
      },
      "lineWidth": {
         "type": "number",
         "minimum": 0
      },
      "transparency": {
         "type": "number",
         "minimum": 0,
         "maximum": 100
      }
   },
   "required": [
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart/dataLayersInfoEnum",
   "type": "string",
   "enum": [
      "area",
      "stackarea",
      "bar",
      "line",
      "stackbar",
      "scatter",
      "stackedscatter",
      "stackbar100",
      "area100"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/conditionalFormatting",
   "type": "object",
   "properties": {
      "activeRules": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/conditionalFormattingRule"
         }
      },
      "enableRuleBlending": {
         "type": "boolean"
      },
      "ruleConfigs": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ruleConfig"
         }
      }
   },
   "required": [
      "activeRules"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/conditionalFormattingRule",
   "type": "object",
   "properties": {
      "ruleID": {
         "type": "string"
      },
      "generationID": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "field": {
         "type": "array",
         "items": {
            "type": "string"
         }
      }
   },
   "required": [
      "ruleID",
      "generationID",
      "field"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ruleConfig",
   "type": "object",
   "properties": {
      "ruleID": {
         "type": "string"
      },
      "applyTo": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "boolean"
         }
      },
      "icon": {
         "type": "object",
         "properties": {
            "columns": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ruleConfigIcon"
            },
            "tile": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ruleConfigIcon"
            }
         },
         "additionalProperties": false
      }
   },
   "required": [
      "ruleID"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ruleConfigIcon",
   "type": "object",
   "properties": {
      "position": {
         "anyOf": [
            {
               "type": "string",
               "const": "beforeValue"
            },
            {
               "type": "string",
               "const": "afterValue"
            },
            {
               "type": "string",
               "const": "iconOnly"
            }
         ]
      },
      "customSize": {
         "type": "number",
         "minimum": 0
      },
      "size": {
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
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/containerProperties",
   "type": "object",
   "properties": {
      "filterExclusions": {
         "type": "array",
         "items": {
            "type": "string"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/displayAsLinkSettings",
   "type": "object",
   "properties": {
      "displayAsLink": {
         "type": "boolean"
      },
      "defaultAction": {
         "type": "string"
      }
   },
   "required": [
      "displayAsLink"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/displayAsLinkSettingsProperties",
   "type": "object",
   "properties": {
      "displayAsLink": {
         "type": "boolean"
      },
      "defaultAction": {
         "type": "string"
      }
   },
   "required": [
      "displayAsLink"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/format",
   "type": "object",
   "properties": {
      "date": {
         "type": "object",
         "properties": {
            "format": {
               "type": "string"
            }
         },
         "required": [
            "format"
         ],
         "additionalProperties": false
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart",
   "type": "object",
   "properties": {
      "settings": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/settings"
      }
   },
   "required": [
      "settings"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/timeUnitInfo",
   "type": "object",
   "properties": {
      "durationTimeUnit": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/timeUnitInfoEnum"
      }
   },
   "required": [
      "durationTimeUnit"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
