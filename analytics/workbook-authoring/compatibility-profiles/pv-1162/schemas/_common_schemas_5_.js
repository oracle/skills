// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/filterUIControl",
   "type": "object",
   "properties": {
      "displayTimeZone": {
         "type": "string"
      },
      "type": {
         "type": "string"
      }
   },
   "required": [
      "displayTimeZone",
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/folder",
   "type": "object",
   "properties": {
      "folderID": {
         "type": "string"
      },
      "folderName": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/"
      },
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/folder"
         }
      },
      "sort": {
         "type": "string"
      }
   },
   "required": [
      "folderID",
      "folderName",
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/folders",
   "type": "object",
   "properties": {
      "calculations": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/calculationFolders"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/font/0.0.0/object",
   "type": "object",
   "properties": {
      "font": {
         "$ref": "http://oracle.com/bi/font/0.0.0/"
      }
   },
   "required": [
      "font"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/formula/0.0.0/",
   "type": "object",
   "properties": {
      "expr": {
         "$ref": "http://oracle.com/bi/expression/0.0.0/"
      }
   },
   "required": [
      "expr"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/gridlines/0.0.0/",
   "type": "object",
   "properties": {
      "type": {
         "$ref": "http://oracle.com/bi/GridlineType/0.0.0/"
      },
      "all": {
         "$ref": "http://oracle.com/bi/gridlines/0.0.0/options"
      },
      "data": {
         "$ref": "http://oracle.com/bi/gridlines/0.0.0/options"
      },
      "header": {
         "$ref": "http://oracle.com/bi/gridlines/0.0.0/options"
      },
      "totals_row": {
         "$ref": "http://oracle.com/bi/gridlines/0.0.0/options"
      },
      "totals_col": {
         "$ref": "http://oracle.com/bi/gridlines/0.0.0/options"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/GraphicLocationOptions",
   "type": "string",
   "enum": [
      "auto",
      "above",
      "below",
      "after",
      "before"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/GridlineDisplayType/0.0.0/",
   "type": "string",
   "enum": [
      "all_inner",
      "horizontal",
      "vertical",
      "all_outer",
      "start_outer",
      "top_outer",
      "end_outer",
      "bottom_outer",
      "none",
      "all"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/gridlines/0.0.0/options",
   "type": "object",
   "properties": {
      "displaytype": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/GridlineDisplayType/0.0.0/"
         }
      },
      "color": {
         "type": "string"
      },
      "linestyle": {
         "type": "string"
      },
      "width": {
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
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/GridlineType/0.0.0/",
   "type": "string",
   "enum": [
      "auto",
      "none",
      "custom"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/groupFilterControl",
   "type": "object",
   "properties": {
      "type": {
         "type": "string",
         "const": "saw:groupFilterControl"
      },
      "vizID": {
         "type": "string"
      },
      "address": {
         "type": "number"
      },
      "filterID": {
         "type": "string"
      },
      "hidden": {
         "type": "boolean"
      },
      "readOnly": {
         "type": "boolean"
      },
      "subjectArea": {
         "type": "string"
      },
      "name": {
         "type": "string"
      },
      "label": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/Label"
      },
      "description": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/Description"
      },
      "groupOperator": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/FilterGroupOperator"
      },
      "filterControlCollectionRef": {
         "type": "string"
      },
      "filterControlConfig": {
         "type": "object",
         "properties": {}
      }
   },
   "required": [
      "type",
      "filterID",
      "label",
      "groupOperator",
      "filterControlCollectionRef",
      "filterControlConfig"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/HTTPMethod",
   "type": "string",
   "enum": [
      "DELETE",
      "GET",
      "PATCH",
      "POST",
      "PUT",
      "TRACE"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/HTTPAPIDataAction",
   "type": "object",
   "properties": {
      "ePayloadType": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/dataActionPayloadType"
      },
      "sPOSTParams": {
         "type": "string"
      },
      "sHTTPHeaders": {
         "type": "string"
      },
      "_sNSVersion": {
         "type": "string"
      }
   },
   "required": [
      "sPOSTParams",
      "sHTTPHeaders",
      "_sNSVersion"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/hierarchySelections",
   "type": "object",
   "properties": {
      "sID": {
         "type": "string"
      },
      "sLevelID": {
         "type": "string"
      },
      "sLevelName": {
         "type": "string"
      },
      "sKey": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "number"
            }
         ]
      },
      "sDisplayName": {
         "type": "string"
      },
      "eSelectionState": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/MemberSelectionState"
      },
      "aChildren": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/hierarchySelections"
         }
      }
   },
   "required": [
      "sID",
      "sLevelID",
      "sLevelName",
      "sKey",
      "sDisplayName",
      "eSelectionState"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/parameters/0.0.0/initialValueValue",
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
   "$id": "http://oracle.com/bi/language/0.0.0/",
   "type": "string",
   "enum": [
      "auto",
      "en",
      "fr",
      "de",
      "it",
      "pt",
      "es",
      "th"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/layouts",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/layoutsChildren"
         },
         "minItems": 1
      }
   },
   "required": [
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/layoutsChildren",
   "type": "object",
   "properties": {
      "name": {
         "type": "string"
      },
      "type": {
         "type": "string"
      },
      "layoutProps": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/layoutsProps"
      },
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/layoutsChildrenChildren"
         },
         "minItems": 0
      }
   },
   "required": [
      "name",
      "type",
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/layoutsChildrenChildren",
   "type": "object",
   "properties": {
      "left": {
         "type": "string"
      },
      "top": {
         "type": "string"
      },
      "zIndex": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "content": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/layoutsChildrenChildrenContent"
      },
      "displayFormat": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/layoutsChildrenChildrenDisplayFormat"
      },
      "displayTitle": {
         "type": "string"
      },
      "filterControlCollectionName": {
         "type": "string"
      },
      "visibility": {
         "type": "string",
         "const": "hidden"
      }
   },
   "required": [
      "content"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/layoutsChildrenChildrenContent",
   "type": "object",
   "properties": {
      "viewName": {
         "type": "string"
      },
      "type": {
         "type": "string"
      }
   },
   "required": [
      "viewName",
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/layoutsChildrenChildrenDisplayFormat",
   "type": "object",
   "properties": {
      "formatSpec": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/layoutsChildrenChildrenDisplayFormatFormatSpec"
      }
   },
   "required": [
      "formatSpec"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/layoutsChildrenChildrenDisplayFormatFormatSpec",
   "type": "object",
   "properties": {
      "width": {
         "type": "string"
      },
      "height": {
         "type": "string"
      }
   },
   "required": [
      "width",
      "height"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/layoutsProps",
   "type": "object",
   "properties": {
      "customProps": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/layoutsPropsCustomProps"
      }
   },
   "required": [
      "customProps"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/layoutsPropsCustomProps",
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
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/levelSelection",
   "type": "object",
   "properties": {
      "aaSelectedLevels": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "string"
         }
      }
   },
   "required": [
      "aaSelectedLevels"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
