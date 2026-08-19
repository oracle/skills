// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/snapshotsChildren",
   "type": "object",
   "properties": {
      "layouts": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/layouts"
      },
      "views": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/views"
      },
      "filterControlCollections": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/"
      },
      "projectVersion": {
         "type": "integer"
      },
      "id": {
         "type": "string"
      },
      "hash": {
         "type": "string"
      },
      "modifiedDate": {
         "type": "string",
         "format": "date-time"
      },
      "description": {
         "type": "string"
      },
      "name": {
         "type": "string"
      },
      "formattedName": {
         "type": "string"
      },
      "canvasRef": {
         "type": "string"
      },
      "isDuplicateStoryPage": {
         "type": "boolean"
      },
      "storyPageConfig": {
         "type": "object",
         "properties": {}
      }
   },
   "required": [
      "projectVersion",
      "id",
      "hash",
      "modifiedDate",
      "description",
      "name",
      "formattedName",
      "canvasRef",
      "isDuplicateStoryPage",
      "storyPageConfig"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/stories",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesChildren"
         }
      },
      "currentStoryID": {
         "type": "string",
         "const": "Story!1"
      }
   },
   "required": [
      "children",
      "currentStoryID"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesApplicationToolBar",
   "type": "object",
   "properties": {
      "customWorkbookPlugin": {
         "type": "boolean"
      },
      "undoRedo": {
         "type": "boolean"
      },
      "refreshData": {
         "type": "boolean"
      },
      "notes": {
         "type": "boolean"
      },
      "export": {
         "type": "boolean"
      },
      "subscribe": {
         "type": "boolean"
      },
      "personalizations": {
         "type": "boolean"
      },
      "showButtons": {
         "type": "boolean"
      },
      "insights": {
         "type": "boolean"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesChildren",
   "type": "object",
   "properties": {
      "isEnabled": {
         "type": "boolean"
      },
      "id": {
         "type": "string",
         "const": "Story!1"
      },
      "name": {
         "type": "string",
         "const": "Story 1"
      },
      "currentStoryPageID": {
         "type": "string"
      },
      "isLocked": {
         "type": "boolean"
      },
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesChildrenChildren"
         }
      },
      "storyConfig": {
         "type": "object",
         "properties": {}
      }
   },
   "required": [
      "isEnabled",
      "id",
      "name",
      "children",
      "storyConfig"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesChildrenChildren",
   "type": "object",
   "properties": {
      "storyPageID": {
         "type": "string"
      },
      "isEnabled": {
         "type": "boolean"
      }
   },
   "required": [
      "storyPageID",
      "isEnabled"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesDataActions",
   "type": "object",
   "properties": {
      "hideInaccessibleDataActions": {
         "type": "boolean"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesFilterActions",
   "type": "object",
   "properties": {
      "disableFilters": {
         "type": "boolean"
      },
      "addFilters": {
         "type": "boolean"
      },
      "removeFilters": {
         "type": "boolean"
      },
      "filterMenu": {
         "type": "boolean"
      },
      "filterSelections": {
         "type": "boolean"
      },
      "overrideMode": {
         "$ref": "http://oracle.com/bi/workbook/overrideMode/0.0.0/"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesFilters",
   "type": "object",
   "properties": {
      "filterActions": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesFilterActions"
      },
      "showFilterBar": {
         "type": "boolean"
      },
      "overrideMode": {
         "$ref": "http://oracle.com/bi/workbook/overrideMode/0.0.0/"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesHeader",
   "type": "object",
   "properties": {
      "showHeader": {
         "type": "boolean"
      },
      "style": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesStyle"
      },
      "text": {
         "type": "object",
         "properties": {
            "useValue": {
               "type": "string"
            },
            "value": {
               "type": "string"
            },
            "typeID": {
               "type": "string"
            },
            "forceIndent": {
               "type": "boolean"
            }
         },
         "required": [
            "useValue",
            "value"
         ],
         "additionalProperties": false
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesInsightsPanel",
   "type": "object",
   "properties": {
      "showInsights": {
         "type": "boolean"
      },
      "showWorkbookAssistant": {
         "type": "boolean"
      },
      "showWatchlists": {
         "type": "boolean"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesMobileExperience",
   "type": "object",
   "properties": {
      "workbookLayout": {
         "type": "string"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesPersonalization",
   "type": "object",
   "properties": {
      "filter": {
         "type": "boolean"
      },
      "parameter": {
         "type": "boolean"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesStyle",
   "type": "object",
   "properties": {
      "background": {
         "$ref": "http://oracle.com/bi/background/0.0.0/"
      },
      "font": {
         "$ref": "http://oracle.com/bi/font/0.0.0/"
      },
      "logo": {
         "$ref": "http://oracle.com/bi/background/0.0.0/"
      }
   },
   "required": [
      "logo"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesVisualizationAction",
   "type": "object",
   "properties": {
      "visualizationToolbar": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesVisualizationToolBar"
      },
      "visualizationMenu": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesVisualizationMenu"
      },
      "visualizationDataActions": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/storiesDataActions"
      },
      "overrideMode": {
         "$ref": "http://oracle.com/bi/workbook/overrideMode/0.0.0/"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesVisualizationMenu",
   "type": "object",
   "properties": {
      "keepSelections": {
         "type": "boolean"
      },
      "sortBy": {
         "type": "boolean"
      },
      "drill": {
         "type": "boolean"
      },
      "zoom": {
         "type": "boolean"
      },
      "dataActions": {
         "type": "boolean"
      },
      "copyData": {
         "type": "boolean"
      },
      "export": {
         "type": "boolean"
      },
      "visualizationInsights": {
         "type": "boolean"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesVisualizationToolBar",
   "type": "object",
   "properties": {
      "showAssignments": {
         "type": "boolean"
      },
      "changeVizType": {
         "type": "boolean"
      },
      "sort": {
         "type": "boolean"
      },
      "addToWatchlist": {
         "type": "boolean"
      },
      "mapActions": {
         "type": "boolean"
      },
      "maximize": {
         "type": "boolean"
      },
      "toolbarMenu": {
         "type": "boolean"
      },
      "exportToolbar": {
         "type": "boolean"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/storiesZoom",
   "type": "object",
   "properties": {
      "zoomEnabled": {
         "type": "boolean"
      },
      "zoomScale": {
         "type": "string"
      }
   },
   "required": [
      "zoomEnabled",
      "zoomScale"
   ],
   "additionalProperties": false
},{
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
}];
   return aSchemas;
} );
