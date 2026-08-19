// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/aiagents",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "type": "object",
            "properties": {
               "agentID": {
                  "type": "string"
               },
               "agentPath": {
                  "type": "string"
               },
               "filterParameterBindings": {
                  "type": "object",
                  "properties": {
                     "children": {
                        "type": "array",
                        "items": {
                           "type": "object",
                           "properties": {
                              "filterID": {
                                 "type": "string"
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
                           "required": [
                              "filterID"
                           ],
                           "additionalProperties": false
                        },
                        "minItems": 0
                     }
                  },
                  "required": [
                     "children"
                  ]
               }
            },
            "required": [
               "agentID",
               "agentPath"
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
   "$id": "http://oracle.com/bi/aiAgent/0.0.0/AIAgentDatasource",
   "type": "object",
   "properties": {
      "id": {
         "type": "string"
      },
      "filterColumns": {
         "type": "boolean"
      },
      "columns": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/aiAgent/0.0.0/AIAgentDatasourceColumn"
         }
      }
   },
   "required": [
      "id"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/aiAgent/0.0.0/AIAgentDatasourceColumn",
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
   "$id": "http://oracle.com/bi/aiAgent/0.0.0/AIAgentFilterSetting",
   "type": "object",
   "properties": {
      "filterID": {
         "type": "string"
      },
      "hidden": {
         "type": "boolean"
      }
   },
   "required": [
      "filterID",
      "hidden"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/aiAgent/0.0.0/AIAgentHistory",
   "type": "object",
   "properties": {
      "enabled": {
         "type": "boolean"
      }
   },
   "required": [
      "enabled"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/aiAgent/0.0.0/aiAgentJSON",
   "type": "object",
   "properties": {
      "agentPurpose": {
         "type": "string"
      },
      "systemPromptCustomization": {
         "type": "string"
      },
      "firstMessage": {
         "type": "string"
      },
      "history": {
         "$ref": "http://oracle.com/bi/aiAgent/0.0.0/AIAgentHistory"
      },
      "datasources": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/aiAgent/0.0.0/AIAgentDatasource"
         }
      },
      "filterSettings": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/aiAgent/0.0.0/AIAgentFilterSetting"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/axis/0.0.0/",
   "type": "string",
   "enum": [
      "row",
      "column"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/abstractDataAction",
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
      "iMaxDataPointSelection"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/abstractDataActionAnchorToColumn",
   "type": "object",
   "properties": {
      "oColumn": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/abstractDataActionColumn"
      },
      "bIsRequired": {
         "type": "boolean"
      },
      "bPassToTarget": {
         "type": "boolean"
      }
   },
   "required": [
      "oColumn",
      "bIsRequired",
      "bPassToTarget"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/abstractDataActionColumn",
   "type": "object",
   "properties": {
      "sColumnID": {
         "type": "string"
      },
      "sColumnName": {
         "type": "string"
      },
      "sQualifiedDisplayName": {
         "type": "string"
      }
   },
   "required": [
      "sColumnID",
      "sColumnName",
      "sQualifiedDisplayName"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/abstractDataActionContextColumn",
   "type": "object",
   "properties": {
      "oColumn": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/abstractDataActionColumn"
      },
      "bIsRequired": {
         "type": "boolean"
      },
      "bPassToTarget": {
         "type": "boolean"
      }
   },
   "required": [
      "oColumn",
      "bIsRequired",
      "bPassToTarget"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/abstractHTTPDataAction",
   "type": "object",
   "properties": {
      "sURL": {
         "type": "string"
      },
      "eHTTPMethod": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/HTTPMethod"
      },
      "_sNSVersion": {
         "type": "string"
      }
   },
   "required": [
      "sURL",
      "eHTTPMethod",
      "_sNSVersion"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/advancedAnalyticsType/0.0.0/",
   "type": "string",
   "enum": [
      "oracle.bi.tech.binby",
      "oracle.bi.tech.cluster",
      "oracle.bi.tech.outlier"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/aggRules/0.0.0/",
   "type": "string",
   "enum": [
      "avg",
      "avgDistinct",
      "bottomN",
      "complex",
      "count",
      "countDistinct",
      "countStar",
      "default",
      "dimAggr",
      "first",
      "last",
      "median",
      "min",
      "max",
      "none",
      "percentile",
      "rank",
      "reportSum",
      "server",
      "subTotal",
      "sum",
      "stddev",
      "topN",
      "unknown",
      "serverAggregate"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/annotations",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/annotationsChildren"
         }
      }
   },
   "required": [
      "children"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/annotationsChildren",
   "type": "object",
   "properties": {
      "id": {
         "type": "string"
      },
      "scopeRef": {
         "type": "string"
      },
      "type": {
         "type": "string",
         "const": "text"
      },
      "note": {
         "type": "string"
      },
      "isHidden": {
         "type": "boolean"
      },
      "dataReferences": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "object",
               "properties": {}
            }
         ]
      },
      "showConnectorLine": {
         "type": "boolean"
      },
      "showConnectorLineUpdated": {
         "type": "boolean"
      },
      "top": {
         "type": "string"
      },
      "left": {
         "type": "string"
      },
      "width": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "height": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      }
   },
   "required": [
      "id",
      "scopeRef",
      "type",
      "note",
      "isHidden",
      "showConnectorLine",
      "top",
      "left"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/background/0.0.0/",
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
               "const": "auto"
            }
         ]
      },
      "color": {
         "type": "string"
      },
      "imageName": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "null"
            }
         ]
      },
      "imageSource": {
         "anyOf": [
            {
               "type": "string",
               "const": "file"
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
      "imageShared": {
         "type": "boolean"
      },
      "imageAlign": {
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
      },
      "imageId": {
         "type": "string"
      },
      "imageContent": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "string"
            }
         ]
      },
      "imageWidth": {
         "anyOf": [
            {
               "type": "string",
               "const": "original"
            },
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "autoFit"
            }
         ]
      },
      "imageHeight": {
         "anyOf": [
            {
               "type": "string",
               "const": "original"
            },
            {
               "type": "string",
               "const": "custom"
            },
            {
               "type": "string",
               "const": "autoFit"
            }
         ]
      },
      "imageWidthOriginal": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "imageHeightOriginal": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "imageWidthPixels": {
         "anyOf": [
            {
               "type": "integer",
               "minimum": 0,
               "maximum": 65535
            },
            {
               "type": "null"
            }
         ]
      },
      "imageHeightPixels": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "colorTransparency": {
         "type": "integer"
      },
      "imageTransparency": {
         "type": "integer"
      },
      "imageRepeat": {
         "anyOf": [
            {
               "type": "string",
               "const": "no-repeat"
            },
            {
               "type": "string",
               "const": "repeat"
            },
            {
               "type": "string",
               "const": "repeat-x"
            },
            {
               "type": "string",
               "const": "repeat-y"
            }
         ]
      },
      "imageAspectRatioLocked": {
         "type": "boolean"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/BINavigationDataAction",
   "type": "object",
   "properties": {
      "sTargetItemPath": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "null"
            }
         ]
      },
      "sTargetItemType": {
         "type": "string"
      },
      "sTargetCanvasID": {
         "type": "string"
      },
      "sTargetDashboardPage": {
         "type": "string"
      },
      "eBIPParameterMappingType": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/DataActionBIPParamMappingType"
      },
      "aBIPParameterMap": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/DataActionBIPParameterMap"
         }
      },
      "_sNSVersion": {
         "type": "string"
      },
      "eParameterPassingMode": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/DataActionParameterPassingMode"
      },
      "aPassedParameters": {
         "type": "array",
         "items": {
            "type": "string"
         }
      }
   },
   "required": [
      "sTargetItemPath",
      "sTargetItemType",
      "sTargetCanvasID",
      "sTargetDashboardPage",
      "eBIPParameterMappingType",
      "aBIPParameterMap",
      "_sNSVersion"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/border/0.0.0/",
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
               "const": "auto"
            },
            {
               "type": "string",
               "const": "square"
            },
            {
               "type": "string",
               "const": "round"
            },
            {
               "type": "string",
               "const": "none"
            }
         ]
      },
      "borderColor": {
         "type": "string"
      },
      "borderWidth": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "borderStyle": {
         "$ref": "http://oracle.com/bi/lineStyle/0.0.0/"
      },
      "borderRadius": {
         "type": "integer",
         "minimum": 0,
         "maximum": 255
      }
   },
   "required": [
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/boxShadow/0.0.0/",
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
               "const": "top_left"
            },
            {
               "type": "string",
               "const": "top_center"
            },
            {
               "type": "string",
               "const": "top_right"
            },
            {
               "type": "string",
               "const": "center_left"
            },
            {
               "type": "string",
               "const": "center_center"
            },
            {
               "type": "string",
               "const": "center_right"
            },
            {
               "type": "string",
               "const": "bottom_left"
            },
            {
               "type": "string",
               "const": "bottom_center"
            },
            {
               "type": "string",
               "const": "bottom_right"
            }
         ]
      },
      "horizontalOffset": {
         "type": "string"
      },
      "verticalOffset": {
         "type": "string"
      },
      "blurRadius": {
         "type": "string"
      },
      "spreadRadius": {
         "type": "string"
      },
      "color": {
         "type": "string"
      }
   },
   "required": [
      "type",
      "horizontalOffset",
      "verticalOffset",
      "blurRadius",
      "spreadRadius",
      "color"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/brushingType/0.0.0/",
   "type": "string",
   "enum": [
      "on",
      "off"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/ButtonOptions",
   "type": "object",
   "properties": {
      "action": {
         "type": "string"
      },
      "type": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/ButtonType"
      },
      "order": {
         "type": "integer"
      },
      "name": {
         "type": "string"
      },
      "values": {
         "type": "array",
         "items": {
            "type": "object",
            "properties": {}
         }
      },
      "graphicColor": {
         "type": "string"
      },
      "graphic": {
         "type": "string"
      },
      "graphicOption": {
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
      },
      "buttonStyle": {
         "anyOf": [
            {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/ButtonStyles"
            },
            {
               "type": "string",
               "const": "auto"
            }
         ]
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
      }
   },
   "required": [
      "type",
      "order"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/ButtonStyles",
   "type": "string",
   "enum": [
      "solid",
      "borderless",
      "outlined",
      "link"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/ButtonType",
   "type": "string",
   "enum": [
      "button",
      "buttonset",
      "buttonmenu",
      "buttondivider"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/currency/0.0.0/",
   "type": "string",
   "enum": [
      "customSymbol",
      "AFN",
      "ALL",
      "ANG",
      "ARS",
      "AWG",
      "AUD",
      "AZN",
      "BAM",
      "BBD",
      "BGN",
      "BMD",
      "BND",
      "BOB",
      "BRL",
      "BSD",
      "BWP",
      "BYR",
      "BZD",
      "CAD",
      "CHF",
      "CLP",
      "CNY",
      "COP",
      "CRC",
      "CUP",
      "CZK",
      "DKK",
      "DOP",
      "EEK",
      "EGP",
      "EUR",
      "FKP",
      "FJD",
      "GBP",
      "GHC",
      "GIP",
      "GTQ",
      "GGP",
      "GYD",
      "HNL",
      "HKD",
      "HRK",
      "HUF",
      "IDR",
      "ILS",
      "IMP",
      "INR",
      "IRR",
      "ISK",
      "JEP",
      "JMD",
      "JPY",
      "KGS",
      "KHR",
      "KPW",
      "KRW",
      "KYD",
      "KZT",
      "LAK",
      "LBP",
      "LKR",
      "LRD",
      "LTL",
      "LVL",
      "MKD",
      "MNT",
      "MUR",
      "MXN",
      "MYR",
      "MZN",
      "NAD",
      "NGN",
      "NIO",
      "NOK",
      "NPR",
      "NZD",
      "OMR",
      "PAB",
      "PEN",
      "PHP",
      "PLN",
      "PKR",
      "PYG",
      "RSD",
      "RUB",
      "SAR",
      "SBD",
      "SCR",
      "SEK",
      "SGD",
      "SOS",
      "SRD",
      "SYP",
      "SVC",
      "THB",
      "TTD",
      "TRL",
      "TVD",
      "TWD",
      "UAH",
      "USD",
      "UYU",
      "UZS",
      "VEF",
      "VND",
      "XCD",
      "YER",
      "ZAR",
      "ZWD"
   ]
}];
   return aSchemas;
} );
