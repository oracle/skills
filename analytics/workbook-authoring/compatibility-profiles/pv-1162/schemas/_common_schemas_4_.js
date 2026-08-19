// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/measuresListChildren",
   "type": "object",
   "properties": {
      "columnID": {
         "type": "string"
      },
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "view"
            },
            {
               "type": "string",
               "const": "column"
            }
         ]
      },
      "name": {
         "type": "string"
      },
      "aggRule": {
         "$ref": "http://oracle.com/bi/workbook/aggRules/0.0.0/"
      },
      "isUsed": {
         "type": "boolean"
      },
      "tags": {
         "type": "array",
         "items": {
            "type": "string"
         }
      },
      "propertyAdditions": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/propertyAdditionsChildren"
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
      "columnID",
      "type"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/columnOrderQDRChildren",
   "type": "object",
   "properties": {
      "specialDimension": {
         "anyOf": [
            {
               "type": "string",
               "const": "grandTotal"
            },
            {
               "type": "string",
               "const": "measure"
            },
            {
               "type": "string",
               "const": "subTotal"
            }
         ]
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
      },
      "groupType": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/QDRChildren/groupType"
      },
      "hierarchyMembers": {
         "anyOf": [
            {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/QDRChildren/hierarchyMembers"
               }
            },
            {
               "type": "object",
               "properties": {
                  "children": {
                     "type": "array",
                     "items": {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/QDRChildren/hierarchyMembers"
                     }
                  }
               },
               "required": [
                  "children"
               ],
               "additionalProperties": false
            }
         ]
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/QDRChildren/groupType",
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
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/eventDataAction",
   "type": "object",
   "properties": {
      "sEventName": {
         "type": "string"
      },
      "_sNSVersion": {
         "type": "string"
      }
   },
   "required": [
      "sEventName",
      "_sNSVersion"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/eventWiring",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "type": "object",
            "properties": {}
         },
         "maxItems": 0
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/expression/0.0.0/",
   "type": "object",
   "properties": {
      "expression": {
         "type": "string"
      },
      "type": {
         "type": "string"
      },
      "children": {
         "type": "array",
         "items": {
            "type": "object",
            "properties": {}
         }
      },
      "formulaUse": {
         "type": "string"
      }
   },
   "required": [
      "expression",
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/expressionFilterControl",
   "type": "object",
   "properties": {
      "type": {
         "type": "string",
         "const": "saw:expressionFilterControl"
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
      "expr": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/filterExpression"
      },
      "filterControlConfig": {
         "type": "object",
         "properties": {}
      },
      "generatedBy": {
         "anyOf": [
            {
               "type": "string",
               "const": "dataAction"
            },
            {
               "type": "string",
               "const": "keepRemove"
            },
            {
               "type": "string",
               "const": "aiAgentAssistant"
            },
            {
               "type": "string",
               "const": "filterSyncManager"
            }
         ]
      }
   },
   "required": [
      "type",
      "filterID",
      "label",
      "expr",
      "filterControlConfig"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/font/0.0.0/",
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
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/filterByColumns",
   "type": "object",
   "properties": {
      "expression": {
         "type": "string"
      },
      "type": {
         "type": "string"
      }
   },
   "required": [
      "expression",
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/Caption",
   "type": "object",
   "properties": {
      "oldID": {
         "type": "string"
      },
      "text": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "null"
            }
         ]
      },
      "captionID": {
         "type": "string"
      },
      "format": {
         "anyOf": [
            {
               "type": "string",
               "const": "text"
            },
            {
               "type": "string",
               "const": "html"
            }
         ]
      }
   },
   "required": [
      "text"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/choicesChildren",
   "type": "object",
   "properties": {
      "value": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/defaultValuesChildren"
      },
      "caption": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/details"
      }
   },
   "required": [
      "value"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollectionRef/0.0.0/",
   "type": "object",
   "properties": {
      "name": {
         "type": "string"
      }
   },
   "required": [
      "name"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/filterControlCollectionsChild"
         }
      }
   },
   "required": [
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/filterControlCollectionsChild",
   "type": "object",
   "properties": {
      "filterControls": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/filterControlTypes"
               }
            }
         },
         "required": [
            "children"
         ],
         "additionalProperties": false
      },
      "subjectArea": {
         "type": "string"
      },
      "name": {
         "type": "string"
      }
   },
   "required": [
      "filterControls",
      "name"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/ComparisonOp",
   "type": "string",
   "enum": [
      "top",
      "bottom",
      "notEqual",
      "equal",
      "less",
      "greater",
      "lessOrEqual",
      "greaterOrEqual",
      "between",
      "null",
      "notNull",
      "in",
      "notIn",
      "and",
      "or"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlConfig/0.0.0/settings",
   "type": "object",
   "properties": {
      "filterModelClassName": {
         "type": "string"
      },
      "location": {
         "type": "string"
      },
      "isEnabled": {
         "type": "boolean"
      },
      "customColumnLabel": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/"
      },
      "filterViz": {
         "type": "string"
      },
      "simplifiedDataElementFormula": {
         "type": "string"
      },
      "topBottomDimFilterFactColumnID": {
         "type": "string"
      },
      "topBottomDimFilterFactColumnFormula": {
         "type": "string"
      },
      "isExclusive": {
         "type": "boolean"
      },
      "limitValuesType": {
         "type": "string"
      },
      "limitValuesFilterList": {
         "type": "array",
         "items": {
            "type": "string"
         }
      },
      "relativeDateRangeType": {
         "anyOf": [
            {
               "type": "string",
               "const": "last"
            },
            {
               "type": "string",
               "const": "next"
            },
            {
               "type": "string",
               "const": "period_to_date"
            }
         ]
      },
      "relativeDateRelativeToType": {
         "anyOf": [
            {
               "type": "string",
               "const": "relative_to_today"
            },
            {
               "type": "string",
               "const": "offsetFromToday"
            },
            {
               "type": "string",
               "const": "availableData"
            },
            {
               "type": "string",
               "const": "endOfLastPeriod"
            },
            {
               "type": "string",
               "const": "startOfNextPeriod"
            }
         ]
      },
      "relativeDateNumberOfPeriods": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "null"
            }
         ]
      },
      "relativeDateTimeLevel": {
         "type": "string"
      },
      "isSingleSelect": {
         "type": "boolean"
      },
      "isBreadcrumbHidden": {
         "type": "boolean"
      },
      "isChipExpanded": {
         "type": "boolean"
      },
      "controlType": {
         "anyOf": [
            {
               "type": "string",
               "const": "combobox"
            },
            {
               "type": "string",
               "const": "inlineList"
            }
         ]
      },
      "enableCustomValues": {
         "type": "boolean"
      },
      "systemOrigin": {
         "type": "string"
      },
      "selectionSteps": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/selectionStepInfo"
         }
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
      "showNullValueInLOV": {
         "type": "boolean"
      },
      "visibleValues": {
         "anyOf": [
            {
               "type": "string",
               "const": "fit"
            },
            {
               "type": "string",
               "const": "custom"
            }
         ]
      },
      "consumerAccess": {
         "anyOf": [
            {
               "type": "string",
               "const": "full"
            },
            {
               "type": "string",
               "const": "restricted"
            },
            {
               "type": "string",
               "const": "minimal"
            }
         ]
      },
      "sharedFilterGroupROID": {
         "type": "string"
      },
      "customVisibleValues": {
         "type": "integer",
         "minimum": 1,
         "maximum": 50
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/defaultValuesChildren",
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
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/filterControlTypes",
   "type": "object",
   "properties": {
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "saw:columnFilterControl"
            },
            {
               "type": "string",
               "const": "saw:expressionFilterControl"
            },
            {
               "type": "string",
               "const": "saw:parameterFilterControl"
            },
            {
               "type": "string",
               "const": "saw:groupFilterControl"
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
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/Description",
   "type": "object",
   "properties": {
      "caption": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/Caption"
      }
   },
   "required": [
      "caption"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/filterExpression",
   "type": "object",
   "properties": {
      "op": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/ComparisonOp"
      },
      "type": {
         "type": "string"
      },
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/filterExpressionChildren"
         }
      },
      "expression": {
         "type": "string"
      },
      "filterID": {
         "type": "string"
      }
   },
   "required": [
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/filterExpressionChildren",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "anyOf": [
               {
                  "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/filterExpressionChildren"
               },
               {
                  "$ref": "http://oracle.com/bi/expression/0.0.0/"
               },
               {
                  "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/filterExpressionColumn"
               }
            ]
         }
      },
      "type": {
         "type": "string"
      },
      "op": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/ComparisonOp"
      }
   },
   "required": [
      "children",
      "type",
      "op"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/filterExpressionColumn",
   "type": "object",
   "properties": {
      "type": {
         "type": "string"
      },
      "formulaUse": {
         "type": "string"
      },
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/filterExpressionFormula"
         }
      }
   },
   "required": [
      "type",
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/filterExpressionFormula",
   "type": "object",
   "properties": {
      "expr": {
         "$ref": "http://oracle.com/bi/expression/0.0.0/"
      },
      "formulaUse": {
         "type": "string"
      }
   },
   "required": [
      "expr"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/FilterGroupOperator",
   "type": "string",
   "enum": [
      "and",
      "or"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/Label",
   "type": "object",
   "properties": {
      "caption": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/Caption"
      }
   },
   "required": [
      "caption"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
