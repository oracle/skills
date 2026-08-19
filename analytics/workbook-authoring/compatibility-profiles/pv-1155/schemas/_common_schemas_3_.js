// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/CustomLabelStyles",
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
   "$id": "http://oracle.com/bi/direction/0.0.0/",
   "type": "string",
   "enum": [
      "ascending",
      "descending"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/dataAction",
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
      "aAnchorToColumns": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/abstractDataActionAnchorToColumn"
         }
      },
      "eValuePassingMode": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/dataActionValuePassingMode"
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
      "iMaxDataPointSelection",
      "aAnchorToColumns",
      "eValuePassingMode"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/DataActionBIPParamMappingType",
   "type": "string",
   "enum": [
      "default",
      "custom"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/DataActionBIPParameterMap",
   "type": "object",
   "properties": {
      "sColumnID": {
         "type": "string"
      },
      "sParameter": {
         "type": "string"
      }
   },
   "required": [
      "sColumnID",
      "sParameter"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/dataActionOpenAs",
   "type": "string",
   "enum": [
      "auto",
      "newTab",
      "sameTab",
      "dialog"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/DataActionParameterPassingMode",
   "type": "string",
   "enum": [
      "all",
      "none",
      "custom"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/dataActionPayloadType",
   "type": "string",
   "enum": [
      "Raw Data",
      "Form Data"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/dataActionValuePassingMode",
   "type": "string",
   "enum": [
      "all",
      "anchorTo",
      "none",
      "custom",
      "column",
      "values"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/dataActionEntry",
   "type": "object",
   "properties": {
      "obitech-report/dataaction.AbstractDataAction": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/dataAction"
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/datasources",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "type": "object",
            "properties": {
               "subjectArea": {
                  "type": "string"
               }
            },
            "required": [
               "subjectArea"
            ],
            "additionalProperties": false
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModelsChildren"
         }
      }
   },
   "required": [
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModelsChildren",
   "type": "object",
   "properties": {
      "logicalDataModel": {
         "type": "object",
         "properties": {}
      },
      "name": {
         "type": "string"
      },
      "edges": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgesChildren"
               }
            }
         },
         "required": [
            "children"
         ],
         "additionalProperties": false
      },
      "measuresList": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/measuresListChildren"
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
      "name"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/columnOrderChildren",
   "type": "object",
   "properties": {
      "columnID": {
         "type": "string"
      },
      "direction": {
         "$ref": "http://oracle.com/bi/direction/0.0.0/"
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
      "columnID",
      "direction"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/columnOrderQDRMemberChildren",
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/displayGrandTotal",
   "type": "object",
   "properties": {
      "id": {
         "type": "string"
      },
      "grandTotalPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "before"
            },
            {
               "type": "string",
               "const": "after"
            }
         ]
      }
   },
   "required": [
      "id",
      "grandTotalPosition"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/displaySubTotal",
   "type": "object",
   "properties": {
      "id": {
         "type": "string"
      },
      "subTotalPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "before"
            },
            {
               "type": "string",
               "const": "after"
            }
         ]
      }
   },
   "required": [
      "id",
      "subTotalPosition"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgeLayersChildren",
   "type": "object",
   "properties": {
      "type": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/edgeLayerTypes"
      },
      "columnID": {
         "type": "string"
      },
      "visibility": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginViewVisibility"
      },
      "duplicateID": {
         "type": "string"
      },
      "displaySubTotal": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/displaySubTotal"
      },
      "aggRule": {
         "$ref": "http://oracle.com/bi/workbook/aggRules/0.0.0/"
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
      },
      "drillState": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgeLayersChildren/drillState"
      }
   },
   "required": [
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgeLayersChildren/drillState",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgeLayersChildren/drillStateChildren"
         }
      }
   },
   "required": [
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgeLayersChildren/drillStateChildren",
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
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgeLayersChildren/drillStateChildren/QDRChildrenHierarchy"
                     },
                     {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgeLayersChildren/drillStateChildren/QDRChildrenMembers"
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
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/selectionGroupsChildren"
               }
            }
         },
         "required": [
            "children"
         ],
         "additionalProperties": false
      },
      "drillParents": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/drillParents"
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
      "drillType",
      "QDR",
      "selectionGroups"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgeLayersChildren/drillStateChildren/QDRChildrenHierarchy",
   "type": "object",
   "properties": {
      "groupType": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/QDRChildren/groupType"
      },
      "hierarchyMembers": {
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
   },
   "required": [
      "groupType",
      "hierarchyMembers"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgeLayersChildren/drillStateChildren/QDRChildrenMembers",
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgesChildren",
   "type": "object",
   "properties": {
      "axis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginViewAxis"
      },
      "showColumnHeader": {
         "type": "string"
      },
      "dependent": {
         "type": "boolean"
      },
      "edgeLayers": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/edgeLayersChildren"
               }
            }
         },
         "required": [
            "children"
         ],
         "additionalProperties": false
      },
      "columnOrder": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/columnOrderChildren"
               }
            }
         },
         "required": [
            "children"
         ],
         "additionalProperties": false
      },
      "displayGrandTotal": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/displayGrandTotal"
      },
      "nullSuppress": {
         "type": "boolean"
      }
   },
   "required": [
      "axis"
   ],
   "additionalProperties": false
},{
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
      }
   },
   "additionalProperties": false
}];
   return aSchemas;
} );
