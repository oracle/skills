// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers/drillState",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers/drillStateChildren"
         }
      }
   },
   "required": [
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers/drillStateChildren",
   "type": "object",
   "properties": {
      "drillType": {
         "type": "string",
         "const": "down"
      },
      "QDR": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "anyOf": [
                     {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers/drillStateChildren/QDRChildrenHierarchy"
                     },
                     {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers/drillStateChildren/QDRChildrenMembers"
                     }
                  ]
               }
            },
            "target": {
               "type": "object",
               "properties": {
                  "columnRefExpr": {
                     "type": "object",
                     "properties": {
                        "columnID": {
                           "type": "string"
                        }
                     },
                     "required": [
                        "columnID"
                     ],
                     "additionalProperties": false
                  }
               },
               "required": [
                  "columnRefExpr"
               ],
               "additionalProperties": false
            }
         },
         "required": [
            "children",
            "target"
         ],
         "additionalProperties": false
      },
      "selectionGroups": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/selectionGroupsChildren"
         }
      },
      "drillParents": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/drillParents"
         }
      }
   },
   "required": [
      "drillType",
      "QDR",
      "selectionGroups"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers/drillStateChildren/QDRChildrenHierarchy",
   "type": "object",
   "properties": {
      "groupType": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/QDRChildren/groupType"
      },
      "hierarchyMembers": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/QDRChildren/hierarchyMembers"
         }
      }
   },
   "required": [
      "groupType",
      "hierarchyMembers"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers/drillStateChildren/QDRChildrenMembers",
   "type": "object",
   "properties": {
      "groupType": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/QDRChildren/groupType"
      },
      "members": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/QDRChildren/members"
      }
   },
   "required": [
      "groupType",
      "members"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers/sort",
   "type": "object",
   "properties": {
      "axis": {
         "$ref": "http://oracle.com/bi/axis/0.0.0/"
      },
      "direction": {
         "$ref": "http://oracle.com/bi/direction/0.0.0/"
      },
      "order": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "QDR": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/columnOrderQDRChildren"
               }
            }
         },
         "required": [
            "children"
         ],
         "additionalProperties": false
      }
   },
   "required": [
      "axis",
      "direction"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges",
   "type": "object",
   "properties": {
      "displayGrandTotal": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/displayGrandTotal"
      },
      "logicalEdgeLayers": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers"
         }
      },
      "nullSuppress": {
         "type": "boolean"
      }
   },
   "required": [
      "logicalEdgeLayers"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/simpleMemberSelection",
   "type": "object",
   "properties": {
      "aSelections": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/hierarchySelections"
         }
      }
   },
   "required": [
      "aSelections"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/snapshots",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/snapshotsChildren"
         }
      }
   },
   "required": [
      "children"
   ],
   "additionalProperties": false
},{
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
         "type": "string"
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
         "type": "string"
      },
      "name": {
         "type": "string"
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
      },
      "filterControlCollections": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/"
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
      },
      "overrideMode": {
         "$ref": "http://oracle.com/bi/workbook/overrideMode/0.0.0/"
      }
   },
   "required": [
      "zoomEnabled"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
