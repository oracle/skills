// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/nonDataActionEntry",
   "type": "object",
   "properties": {
      "obitech-report/dataaction.AbstractDataAction": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/nonDataAction"
      },
      "obitech-report/dataaction.AbstractHTTPDataAction": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/abstractHTTPDataAction"
      },
      "obitech-report/dataaction.HTTPAPIDataAction": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/HTTPAPIDataAction"
      },
      "obitech-report/dataaction.EventDataAction": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/eventDataAction"
      },
      "obitech-report/dataaction.BINavigationDataAction": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/BINavigationDataAction"
      },
      "obitech-report/dataaction.SetParameterDataAction": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/setParameterDataAction"
      }
   },
   "required": [
      "obitech-report/dataaction.AbstractDataAction"
   ],
   "unevaluatedProperties": {}
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/overrideMode/0.0.0/",
   "type": "string",
   "enum": [
      "auto",
      "custom"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/parameterFilterControl",
   "type": "object",
   "properties": {
      "type": {
         "type": "string",
         "const": "saw:parameterFilterControl"
      },
      "filterID": {
         "type": "string"
      },
      "parameter": {
         "type": "string"
      },
      "filterControlConfig": {
         "type": "object",
         "properties": {}
      },
      "vizID": {
         "type": "string"
      },
      "address": {
         "type": "number"
      },
      "filterViz": {
         "type": "string"
      },
      "hidden": {
         "type": "boolean"
      },
      "customColumnLabel": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/Label"
      },
      "selectionRequired": {
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
      "isSingleSelect": {
         "type": "boolean"
      },
      "customVisibleValues": {
         "type": "integer",
         "minimum": 1,
         "maximum": 50
      }
   },
   "required": [
      "type",
      "filterID",
      "parameter",
      "filterControlConfig"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/parameterValue",
   "type": "object",
   "properties": {
      "vValue": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "number"
            }
         ]
      },
      "sDisplayValue": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "null"
            }
         ]
      }
   },
   "required": [
      "vValue"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/parameters/0.0.0/initialValue",
   "type": "object",
   "properties": {
      "type": {
         "type": "string"
      },
      "value": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "null"
            },
            {
               "type": "number"
            },
            {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/parameters/0.0.0/initialValueValue"
               }
            }
         ]
      },
      "displayName": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "$ref": "http://oracle.com/bi/caption/0.0.0/"
            }
         ]
      },
      "isCustom": {
         "type": "boolean"
      }
   },
   "required": [
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/parameters/0.0.0/possibleValue",
   "type": "object",
   "properties": {
      "type": {
         "type": "string"
      },
      "value": {
         "anyOf": [
            {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/parameters/0.0.0/possibleValueValue"
               }
            },
            {
               "$ref": "http://oracle.com/bi/parameters/0.0.0/possibleValueObject"
            },
            {
               "$ref": "http://oracle.com/bi/parameters/0.0.0/possibleValueSecondObject"
            }
         ]
      }
   },
   "required": [
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/parameters/0.0.0/settings",
   "type": "object",
   "properties": {
      "name": {
         "type": "string"
      },
      "description": {
         "type": "string"
      },
      "dataType": {
         "type": "string"
      },
      "isLocked": {
         "type": "boolean"
      },
      "isMultiValue": {
         "type": "boolean"
      },
      "isAliasEnabled": {
         "type": "boolean"
      },
      "numberFormatting": {
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
      "enforceValidation": {
         "type": "boolean"
      },
      "initialValue": {
         "$ref": "http://oracle.com/bi/parameters/0.0.0/initialValue"
      },
      "possibleValue": {
         "$ref": "http://oracle.com/bi/parameters/0.0.0/possibleValue"
      },
      "timezoneID": {
         "type": "string"
      },
      "dateFormat": {
         "type": "string"
      }
   },
   "required": [
      "name",
      "dataType",
      "isMultiValue",
      "isAliasEnabled",
      "initialValue",
      "possibleValue"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView",
   "type": "object",
   "properties": {
      "type": {
         "type": "string",
         "const": "saw:pluginView"
      },
      "pluginType": {
         "type": "string"
      },
      "viewName": {
         "type": "string"
      },
      "dataModels": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels"
      },
      "viewConfig": {
         "type": "object",
         "properties": {}
      },
      "physicalDataModelVersion": {
         "type": "string"
      },
      "nestedViews": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/nestedViews"
      },
      "viewCaption": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/"
      },
      "lastSavedLogicalDataModel": {
         "type": "object",
         "properties": {}
      }
   },
   "required": [
      "type",
      "pluginType",
      "viewName"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginViewAxis",
   "type": "string",
   "enum": [
      "row",
      "column",
      "page",
      "section"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/edgeLayerTypes",
   "type": "string",
   "enum": [
      "column",
      "measure",
      "parameter"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/nestedViewPosition",
   "type": "string",
   "enum": [
      "embedded"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/nestedViews",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/nestedViewsChildren"
         }
      }
   },
   "required": [
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/nestedViewsChildren",
   "type": "object",
   "properties": {
      "position": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/nestedViewPosition"
      },
      "view": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/nestedViewsView"
      }
   },
   "required": [
      "position",
      "view"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/nestedViewsView",
   "type": "object",
   "properties": {
      "type": {
         "type": "string",
         "const": "saw:pluginView"
      },
      "pluginType": {
         "type": "string"
      },
      "viewName": {
         "type": "string"
      },
      "dataModels": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels"
      },
      "physicalDataModelVersion": {
         "type": "string"
      }
   },
   "required": [
      "type",
      "pluginType",
      "viewName",
      "dataModels",
      "physicalDataModelVersion"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/trellisScope",
   "type": "string",
   "enum": [
      "none",
      "row",
      "column",
      "data"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginViewVisibility",
   "type": "string",
   "enum": [
      "hidden",
      "visible"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/parameters/0.0.0/possibleValueObject",
   "type": "object",
   "properties": {
      "min": {
         "anyOf": [
            {
               "type": "number"
            },
            {
               "type": "string"
            },
            {
               "type": "null"
            }
         ]
      },
      "max": {
         "anyOf": [
            {
               "type": "number"
            },
            {
               "type": "string"
            },
            {
               "type": "null"
            }
         ]
      }
   },
   "required": [
      "min",
      "max"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/parameters/0.0.0/possibleValueSecondObject",
   "type": "object",
   "properties": {
      "value": {
         "type": "string"
      },
      "displayName": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "$ref": "http://oracle.com/bi/caption/0.0.0/"
            }
         ]
      }
   },
   "required": [
      "value"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/parameters/0.0.0/possibleValueValue",
   "type": "object",
   "properties": {
      "value": {
         "anyOf": [
            {
               "type": "number"
            },
            {
               "type": "string"
            }
         ]
      },
      "isFormula": {
         "type": "boolean"
      },
      "hasSortKey": {
         "type": "boolean"
      },
      "displayName": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "$ref": "http://oracle.com/bi/caption/0.0.0/"
            }
         ]
      }
   },
   "required": [
      "value"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/propertyAdditionsChildren",
   "type": "object",
   "properties": {
      "id": {
         "type": "string"
      },
      "valueColumnID": {
         "type": "string"
      },
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "shareOfColumn"
            },
            {
               "type": "string",
               "const": "shareOfParent"
            }
         ]
      },
      "aggRule": {
         "$ref": "http://oracle.com/bi/workbook/aggRules/0.0.0/"
      },
      "stacked": {
         "type": "boolean"
      },
      "placement": {
         "type": "string"
      },
      "grainEdge": {
         "type": "string"
      },
      "stackType": {
         "type": "string"
      },
      "stackColumns": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/propAdditions/columnsChildren"
               }
            }
         },
         "required": [
            "children"
         ],
         "additionalProperties": false
      },
      "paSimpleColumnFormula": {
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
      },
      "acrossMeasures": {
         "type": "string"
      },
      "acrossMeasureColumns": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/propAdditions/columnsChildren"
               }
            }
         },
         "required": [
            "children"
         ],
         "additionalProperties": false
      },
      "acrossMeasureExpressions": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/propAdditions/expressionsChildren"
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
      "id",
      "aggRule",
      "stacked",
      "placement",
      "grainEdge"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/propAdditions/columnsChildren",
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
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/propAdditions/expressionsChildren",
   "type": "object",
   "properties": {
      "expr": {
         "type": "string"
      }
   },
   "required": [
      "expr"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/reportConfig/0.0.0/settings",
   "type": "object",
   "properties": {
      "oracle.bi.tech.shapeSchemeService": {
         "type": "object",
         "properties": {}
      },
      "oracle.bi.tech.colorSchemeService": {
         "type": "object",
         "properties": {}
      },
      "oracle.bi.tech.filterBar": {
         "type": "object",
         "properties": {}
      },
      "projectSettings": {
         "type": "object",
         "properties": {}
      },
      "reportenvironment": {
         "type": "object",
         "properties": {}
      },
      "querybuilder": {
         "type": "object",
         "properties": {}
      },
      "storynavigator": {
         "type": "object",
         "properties": {}
      },
      "conditionalFormatRules": {
         "type": "object",
         "properties": {}
      },
      "autoApplyData": {
         "type": "object",
         "properties": {}
      },
      "maximizeViewMode": {
         "$ref": "http://oracle.com/bi/reportConfig/0.0.0/settings/maximizeViewMode"
      },
      "annotationsSettings": {
         "$ref": "http://oracle.com/bi/reportConfig/0.0.0/settings/annotationsSettings"
      }
   },
   "required": [
      "oracle.bi.tech.shapeSchemeService",
      "oracle.bi.tech.colorSchemeService"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/reportConfig/0.0.0/settings/annotationsSettings",
   "type": "object",
   "properties": {
      "_version": {
         "type": "string",
         "const": "1.0.0"
      },
      "settings": {
         "type": "object",
         "properties": {
            "hideAllAnnotationsInVisualize": {
               "type": "boolean"
            }
         },
         "required": [
            "hideAllAnnotationsInVisualize"
         ],
         "additionalProperties": false
      }
   },
   "required": [
      "_version",
      "settings"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/reportConfig/0.0.0/categoricalSchemes",
   "type": "object",
   "properties": {
      "id": {
         "type": "string"
      },
      "name": {
         "type": "string"
      },
      "colors": {
         "type": "array",
         "items": {
            "type": "string"
         }
      }
   },
   "required": [
      "id",
      "name"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
