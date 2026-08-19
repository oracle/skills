// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/calculationFolder",
   "type": "object",
   "properties": {
      "calcFolderKey": {
         "type": "string"
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
      "calcFolderKey",
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/calculationFolders",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/calculationFolder"
         }
      }
   },
   "required": [
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/canvasConfigSettings",
   "type": "object",
   "properties": {
      "brushingType": {
         "$ref": "http://oracle.com/bi/brushingType/0.0.0/"
      },
      "filterBarIsCollapsed": {
         "type": "boolean"
      },
      "responsiveLayouts": {
         "type": "object",
         "properties": {
            "currentLayout": {
               "type": "string"
            },
            "breakpointsMap": {
               "type": "object",
               "properties": {},
               "unevaluatedProperties": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/canvasConfigSettings/breakpointsMapEntry"
               }
            }
         },
         "required": [
            "currentLayout",
            "breakpointsMap"
         ],
         "additionalProperties": false
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/canvasConfigSettings/breakpointsMapEntry",
   "type": "object",
   "properties": {
      "value": {
         "type": "integer"
      }
   },
   "required": [
      "value"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/canvasRootView",
   "type": "object",
   "properties": {
      "type": {
         "type": "string",
         "const": "saw:canvas"
      },
      "viewName": {
         "type": "string"
      },
      "rootLayoutName": {
         "type": "string"
      },
      "viewCaption": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/details"
      },
      "filterControlCollectionRef": {
         "$ref": "http://oracle.com/bi/filterControlCollectionRef/0.0.0/"
      }
   },
   "required": [
      "type",
      "viewName",
      "rootLayoutName"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/canvasView",
   "type": "object",
   "properties": {
      "type": {
         "type": "string",
         "const": "saw:canvas"
      },
      "viewName": {
         "type": "string"
      },
      "masterViewName": {
         "type": "string"
      },
      "rootLayoutName": {
         "type": "string"
      },
      "canvasConfig": {
         "type": "object",
         "properties": {}
      },
      "canvasProps": {
         "type": "object",
         "properties": {
            "displayFormat": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/canvasViewDisplayFormat"
            },
            "fitContents": {
               "type": "string"
            },
            "style": {
               "$ref": "http://oracle.com/bi/style/0.0.0/"
            }
         },
         "additionalProperties": false
      },
      "filterControlCollectionRef": {
         "$ref": "http://oracle.com/bi/filterControlCollectionRef/0.0.0/"
      },
      "viewCaption": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/"
      },
      "viewDescription": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/details"
      },
      "syncViews": {
         "type": "string",
         "const": "none"
      }
   },
   "required": [
      "type",
      "viewName",
      "rootLayoutName",
      "canvasConfig"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/canvasViewDisplayFormat",
   "type": "object",
   "properties": {
      "formatSpec": {
         "type": "object",
         "properties": {
            "width": {
               "type": "string"
            },
            "height": {
               "type": "string"
            }
         },
         "additionalProperties": false
      }
   },
   "required": [
      "formatSpec"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/caption/0.0.0/",
   "type": "object",
   "properties": {
      "caption": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/details"
      }
   },
   "required": [
      "caption"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/caption/0.0.0/details",
   "type": "object",
   "properties": {
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
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/columnFilterControl",
   "type": "object",
   "properties": {
      "type": {
         "type": "string",
         "const": "saw:columnFilterControl"
      },
      "columnID": {
         "type": "string"
      },
      "filterID": {
         "type": "string"
      },
      "filterControlConfig": {
         "type": "object",
         "properties": {}
      },
      "formula": {
         "$ref": "http://oracle.com/bi/formula/0.0.0/"
      },
      "filterOperator": {
         "type": "object",
         "properties": {
            "op": {
               "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/ComparisonOp"
            }
         },
         "required": [
            "op"
         ],
         "additionalProperties": false
      },
      "filterControlDefaultValues": {
         "type": "object",
         "properties": {
            "type": {
               "type": "string",
               "const": "specificValue"
            },
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/defaultValuesChildren"
               },
               "minItems": 0
            },
            "usingCodeValue": {
               "type": "boolean"
            },
            "listParameterBinding": {
               "type": "string"
            },
            "startParameterBinding": {
               "type": "string"
            },
            "endParameterBinding": {
               "type": "string"
            },
            "countParameterBinding": {
               "type": "string"
            },
            "methodParameterBinding": {
               "type": "string"
            },
            "incrementParameterBinding": {
               "type": "string"
            },
            "timeLevelParameterBinding": {
               "type": "string"
            },
            "relativeToParameterBinding": {
               "type": "string"
            },
            "rangeTypeParameterBinding": {
               "type": "string"
            },
            "excludesParameterBinding": {
               "type": "string"
            }
         },
         "additionalProperties": false
      },
      "filterControlSource": {
         "type": "object",
         "properties": {
            "type": {
               "type": "string"
            },
            "filterControlChoices": {
               "type": "object",
               "properties": {
                  "children": {
                     "type": "array",
                     "items": {
                        "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/choicesChildren"
                     }
                  }
               },
               "required": [
                  "children"
               ]
            }
         },
         "required": [
            "type",
            "filterControlChoices"
         ],
         "additionalProperties": false
      },
      "vizID": {
         "type": "string"
      },
      "address": {
         "type": "number"
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
      "expr": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/filterExpression"
      },
      "generatedBy": {
         "type": "string",
         "const": "dataAction"
      },
      "filterByColumns": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/filterByColumns"
               }
            }
         },
         "required": [
            "children"
         ],
         "additionalProperties": false
      },
      "filterUIControl": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/filterUIControl"
      },
      "customColumnLabel": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/Label"
      },
      "filterViz": {
         "type": "string"
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
      "limitValuesType": {
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
               "const": "custumlist"
            },
            {
               "type": "string",
               "const": "default"
            }
         ]
      },
      "limitValuesFilterList": {
         "type": "array",
         "items": {
            "type": "string"
         }
      },
      "controlType": {
         "anyOf": [
            {
               "type": "string",
               "const": "listFilterPanel"
            },
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
      "showNullValueInLOV": {
         "type": "boolean"
      },
      "enableCustumValues": {
         "type": "boolean"
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
      "columnID",
      "filterID"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/CommonButtonProperties",
   "type": "object",
   "properties": {
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
      }
   }
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteria",
   "type": "object",
   "properties": {
      "type": {
         "type": "string"
      },
      "subjectArea": {
         "type": "string"
      },
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/criteria"
         }
      },
      "columns": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaColumns"
      },
      "filter": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaFilter"
      },
      "criteriaConfig": {
         "type": "object",
         "properties": {}
      },
      "withinHierarchy": {
         "type": "boolean"
      },
      "queryDimensionality": {
         "type": "boolean"
      },
      "from": {
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
   "required": [
      "type",
      "columns"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaColumns",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren"
         },
         "minItems": 0
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren",
   "type": "object",
   "properties": {
      "columnID": {
         "type": "string"
      },
      "type": {
         "type": "string"
      },
      "subjectArea": {
         "type": "string"
      },
      "userExpression": {
         "type": "boolean"
      },
      "columnFormula": {
         "$ref": "http://oracle.com/bi/formula/0.0.0/"
      },
      "columnHeading": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/"
      },
      "columnDescription": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/"
      },
      "advancedAnalyticsType": {
         "$ref": "http://oracle.com/bi/advancedAnalyticsType/0.0.0/"
      },
      "dimensionID": {
         "type": "string"
      },
      "dimensionSelection": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/dimensionSelection"
      },
      "tableName": {
         "type": "string"
      },
      "forceGroupBy": {
         "type": "boolean"
      },
      "aggRule": {
         "$ref": "http://oracle.com/bi/workbook/aggRules/0.0.0/"
      },
      "hierarchyID": {
         "type": "string"
      },
      "hierarchyLevels": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/hierarchyLevelsChildren"
               }
            }
         },
         "required": [
            "children"
         ],
         "additionalProperties": false
      },
      "displayFormat": {
         "type": "object",
         "properties": {
            "formatSpec": {
               "type": "object",
               "properties": {
                  "dataFormat": {
                     "type": "object",
                     "properties": {
                        "type": {
                           "anyOf": [
                              {
                                 "type": "string",
                                 "const": "saw:percent"
                              },
                              {
                                 "type": "string",
                                 "const": "saw:number"
                              },
                              {
                                 "type": "string",
                                 "const": "saw:currency"
                              }
                           ]
                        },
                        "commas": {
                           "type": "string",
                           "const": "true"
                        },
                        "maxDigits": {
                           "type": "integer",
                           "minimum": 0,
                           "maximum": 255
                        },
                        "minDigits": {
                           "type": "integer",
                           "minimum": 0,
                           "maximum": 255
                        },
                        "currencyTag": {
                           "type": "string"
                        }
                     },
                     "required": [
                        "type",
                        "commas",
                        "maxDigits",
                        "minDigits"
                     ],
                     "additionalProperties": false
                  },
                  "hAlign": {
                     "type": "string",
                     "const": "default"
                  },
                  "vAlign": {
                     "type": "string",
                     "const": "default"
                  },
                  "wrapText": {
                     "type": "boolean"
                  }
               },
               "required": [
                  "hAlign",
                  "vAlign",
                  "wrapText"
               ],
               "additionalProperties": false
            }
         },
         "required": [
            "formatSpec"
         ],
         "additionalProperties": false
      },
      "folderID": {
         "type": "string"
      }
   },
   "required": [
      "columnID",
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/dimensionSelection",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/dimensionSelectionChildren/children"
         }
      }
   },
   "required": [
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/dimensionSelectionChildren/children",
   "type": "object",
   "properties": {
      "category": {
         "type": "string",
         "const": "hierarchyRelation"
      },
      "stepID": {
         "type": "string"
      },
      "type": {
         "type": "string",
         "const": "startWith"
      },
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/dimensionSelectionChildren/children/children"
         }
      }
   },
   "required": [
      "category",
      "stepID",
      "type",
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/dimensionSelectionChildren/children/children",
   "type": "object",
   "properties": {
      "type": {
         "type": "string",
         "const": "saw:staticMemberGroupDef"
      },
      "staticMemberGroup": {
         "type": "object",
         "properties": {
            "hierarchyMembers": {
               "type": "object",
               "properties": {
                  "children": {
                     "type": "array",
                     "items": {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/dimensionSelectionChildren/children/children/hierarchyMembers"
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
            "hierarchyMembers"
         ],
         "additionalProperties": false
      }
   },
   "required": [
      "type",
      "staticMemberGroup"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/dimensionSelectionChildren/children/children/hierarchyMembers",
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
            "type": {
               "type": "string",
               "const": "saw:specialValueMembers"
            },
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/dimensionSelectionChildren/children/children/hierarchyMembers/members"
               }
            }
         },
         "required": [
            "type",
            "children"
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/dimensionSelectionChildren/children/children/hierarchyMembers/members",
   "type": "object",
   "properties": {
      "specialValue": {
         "type": "string",
         "const": "all"
      }
   },
   "required": [
      "specialValue"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaColumnsChildren/hierarchyLevelsChildren",
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
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaConfig/dateTimePreferences/timeLevel",
   "type": "string",
   "enum": [
      "millisecond",
      "second",
      "minute",
      "hour",
      "hour of day",
      "day",
      "day of week",
      "day of month",
      "day of year",
      "week",
      "week of year",
      "month",
      "month of year",
      "quarter",
      "quarter of year",
      "year"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaFilter",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaFilterChildren"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaFilterChildren",
   "type": "object",
   "properties": {
      "op": {
         "type": "string",
         "const": "and"
      },
      "type": {
         "type": "string",
         "const": "sawx:logical"
      },
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaFilterChildren/children"
         }
      }
   },
   "required": [
      "op",
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaFilterChildren/children",
   "type": "object",
   "properties": {
      "op": {
         "type": "string",
         "const": "in"
      },
      "type": {
         "type": "string",
         "const": "sawx:list"
      },
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/criteriaFilterChildren/children/children"
         }
      }
   },
   "required": [
      "op",
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/criteriaFilterChildren/children/children",
   "type": "object",
   "properties": {
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "sawx:sqlExpression"
            },
            {
               "type": "string",
               "const": "sawx:untypedLiteral"
            }
         ]
      },
      "expression": {
         "type": "string"
      }
   },
   "required": [
      "type",
      "expression"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
