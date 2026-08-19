// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/lineStyle/0.0.0/",
   "type": "string",
   "enum": [
      "solid",
      "dashed",
      "dotted"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/mlmodel",
   "type": "object",
   "properties": {
      "id": {
         "type": "string"
      },
      "connectedSubjectArea": {
         "type": "string"
      },
      "inputMappings": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/mlmodelInputMapping"
               },
               "minItems": 0
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
      "connectedSubjectArea"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/mlmodelInputMapping",
   "type": "object",
   "properties": {
      "scriptInput": {
         "type": "string"
      },
      "formula": {
         "type": "string"
      }
   },
   "required": [
      "scriptInput",
      "formula"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/mlmodels",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/mlmodel"
         },
         "minItems": 0
      }
   },
   "required": [
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/MemberSelectionState",
   "type": "string",
   "enum": [
      "s",
      "d",
      "u"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/nonDataAction",
   "type": "object",
   "properties": {
      "sClass": {
         "type": "string"
      },
      "sID": {
         "type": "string"
      },
      "sName": {
         "type": "string"
      },
      "sScopeID": {
         "type": "string"
      },
      "aContextColumns": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/abstractDataActionContextColumn"
         }
      },
      "sVersion": {
         "type": "string"
      },
      "_sNSVersion": {
         "type": "string"
      },
      "iMaxDataPointSelection": {
         "type": "integer",
         "minimum": 0,
         "maximum": 4294967295
      },
      "eOpenAs": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/dataActionOpenAs"
      },
      "bIsEnabled": {
         "type": "boolean"
      },
      "eValuePassingMode": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/nonDataActionValuePassingMode"
      }
   },
   "required": [
      "sClass",
      "sID",
      "sName",
      "sScopeID",
      "aContextColumns",
      "sVersion",
      "_sNSVersion",
      "eValuePassingMode"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/nonDataActionValuePassingMode",
   "type": "string",
   "enum": [
      "all",
      "none",
      "custom",
      "values"
   ]
},{
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/parameterAssignment",
   "type": "object",
   "properties": {
      "sParameterName": {
         "type": "string"
      },
      "eValuePassingMode": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/dataActionValuePassingMode"
      },
      "aValues": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/parameterValue"
         }
      },
      "oColumn": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/abstractDataActionColumn"
      }
   },
   "required": [
      "sParameterName",
      "eValuePassingMode"
   ],
   "additionalProperties": false
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
}];
   return aSchemas;
} );
