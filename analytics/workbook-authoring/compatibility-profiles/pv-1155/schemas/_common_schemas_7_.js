// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/reportConfig/0.0.0/settingsColorDomains",
   "type": "object",
   "properties": {
      "generation": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "colorMap": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "anyOf": [
               {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 4294967295
               },
               {
                  "type": "string"
               }
            ]
         }
      },
      "oMeasureMap": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/reportConfig/0.0.0/settingsColorDomains/measureMap"
         }
      },
      "coloringType": {
         "anyOf": [
            {
               "type": "string",
               "const": "categoricalSchemes"
            },
            {
               "type": "string",
               "const": "monochromeSchemes"
            },
            {
               "type": "string",
               "const": "sequentialSchemes"
            },
            {
               "type": "string",
               "const": "datapointSchemes"
            }
         ]
      },
      "colorScheme": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "type": "null"
            }
         ]
      },
      "noRepeat": {
         "type": "boolean"
      },
      "hierarchical": {
         "type": "boolean"
      },
      "hierMappingId": {
         "type": "string"
      },
      "nextIndex": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      }
   },
   "required": [
      "generation",
      "colorMap",
      "coloringType",
      "colorScheme"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/reportConfig/0.0.0/settingsDomains",
   "type": "object",
   "properties": {
      "generation": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "valueMap": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "anyOf": [
               {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 4294967295
               },
               {
                  "type": "string"
               }
            ]
         }
      },
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "categoricalSchemes"
            },
            {
               "type": "string",
               "const": "datapointSchemes"
            }
         ]
      },
      "scheme": {
         "type": "null"
      },
      "nextIndex": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      }
   },
   "required": [
      "generation",
      "valueMap",
      "type",
      "scheme",
      "nextIndex"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/reportConfig/0.0.0/settings/maximizeViewMode",
   "type": "object",
   "properties": {
      "_version": {
         "type": "string",
         "const": "1.0.0"
      },
      "settings": {
         "type": "object",
         "properties": {
            "viewName": {
               "type": "string"
            }
         },
         "required": [
            "viewName"
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
   "$id": "http://oracle.com/bi/reportConfig/0.0.0/settingsColorDomains/measureMap",
   "type": "object",
   "properties": {
      "sColorScheme": {
         "type": "string"
      },
      "bInvert": {
         "type": "boolean"
      },
      "aColors": {
         "type": "array",
         "items": {
            "type": "string"
         }
      },
      "nMidpoint": {
         "type": "integer"
      },
      "nBins": {
         "type": "integer",
         "minimum": 0
      }
   },
   "required": [
      "sColorScheme",
      "bInvert"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/shape/0.0.0/",
   "type": "object",
   "properties": {
      "cx": {
         "type": "number",
         "minimum": 0
      },
      "cy": {
         "type": "number",
         "minimum": 0
      },
      "type": {
         "type": "string",
         "const": "circle"
      }
   },
   "required": [
      "cx",
      "cy",
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/style/0.0.0/",
   "type": "object",
   "properties": {
      "background": {
         "$ref": "http://oracle.com/bi/background/0.0.0/"
      },
      "border": {
         "$ref": "http://oracle.com/bi/border/0.0.0/"
      },
      "font": {
         "$ref": "http://oracle.com/bi/font/0.0.0/"
      },
      "boxshadow": {
         "$ref": "http://oracle.com/bi/boxShadow/0.0.0/"
      },
      "themeFont": {
         "$ref": "http://oracle.com/bi/themeFont/0.0.0/"
      },
      "fill": {
         "type": "string"
      },
      "fillOpacity": {
         "type": "number",
         "minimum": 0,
         "maximum": 1
      },
      "stroke": {
         "type": "string"
      },
      "strokeThickness": {
         "type": "number",
         "minimum": 0
      },
      "strokeOpacity": {
         "type": "number",
         "minimum": 0,
         "maximum": 1
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/SelectionAction",
   "type": "string",
   "enum": [
      "add",
      "keep",
      "remove",
      "combo"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/SelectionOperator",
   "type": "string",
   "enum": [
      "levels",
      "members",
      "membersChildren",
      "membersParents",
      "membersDescendants",
      "membersAncestors",
      "membersSiblings",
      "membersLeaves",
      "children",
      "parents",
      "descendants",
      "ancestors",
      "siblings",
      "leaves",
      "nulls"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/filterControlCollections/0.0.0/selectionStepInfo",
   "type": "object",
   "properties": {
      "sID": {
         "type": "string"
      },
      "eAction": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/SelectionAction"
      },
      "eOperator": {
         "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/SelectionOperator"
      },
      "oSelection": {
         "anyOf": [
            {
               "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/simpleMemberSelection"
            },
            {
               "$ref": "http://oracle.com/bi/filterControlCollections/0.0.0/levelSelection"
            }
         ]
      }
   },
   "required": [
      "sID",
      "eAction",
      "eOperator",
      "oSelection"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/setParameterDataAction",
   "type": "object",
   "properties": {
      "sParameterName": {
         "type": "string"
      },
      "aValues": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/parameterValue"
         }
      },
      "_sNSVersion": {
         "type": "string"
      }
   },
   "required": [
      "sParameterName",
      "_sNSVersion"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModel/mapColumnCache",
   "type": "object",
   "properties": {
      "oMatchResponseLayer": {
         "type": "object",
         "properties": {
            "name": {
               "type": "string"
            },
            "gtype": {
               "type": "string"
            },
            "size": {
               "type": "integer",
               "minimum": 0,
               "maximum": 4294967295
            },
            "matches": {
               "type": "integer",
               "minimum": 0,
               "maximum": 4294967295
            },
            "match_percent": {
               "type": "number"
            },
            "score": {
               "type": "number"
            },
            "matchPercentage": {
               "type": "integer",
               "minimum": 0,
               "maximum": 65535
            },
            "lastModified": {
               "type": "integer",
               "minimum": 0
            }
         },
         "required": [
            "name",
            "gtype",
            "size",
            "matches",
            "match_percent",
            "score",
            "matchPercentage",
            "lastModified"
         ],
         "additionalProperties": false
      },
      "aFeatureIds": {
         "type": "array",
         "items": {
            "type": "string"
         }
      },
      "aMatchColumnInfos": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModel/mapMatchColumnInfos"
         }
      },
      "aGeoFeaturePropertyNames": {
         "anyOf": [
            {
               "type": "array",
               "items": {
                  "type": "string"
               }
            },
            {
               "type": "null"
            }
         ]
      },
      "aNonExactValueMatches": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModel/mapColumnCache/nonExactMatch"
         }
      },
      "sGeoColumnFormulasKey": {
         "type": "string"
      },
      "bPopulateAutoCache": {
         "type": "boolean"
      },
      "aTemplates": {}
   },
   "required": [
      "oMatchResponseLayer",
      "aMatchColumnInfos",
      "aGeoFeaturePropertyNames",
      "aNonExactValueMatches",
      "sGeoColumnFormulasKey",
      "bPopulateAutoCache"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModel/mapColumnCache/nonExactMatch",
   "type": "object",
   "properties": {
      "geokey": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "string"
            }
         ]
      },
      "values": {
         "type": "array",
         "items": {
            "type": "string"
         }
      }
   },
   "required": [
      "geokey",
      "values"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModel/mapMatchColumnInfos",
   "type": "object",
   "properties": {
      "name": {
         "type": "string"
      },
      "taggedTo": {
         "type": "string"
      },
      "is_geo": {
         "type": "boolean"
      }
   },
   "required": [
      "name",
      "taggedTo",
      "is_geo"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModel/dataLayers",
   "type": "object",
   "properties": {
      "logicalDataModel": {
         "type": "object",
         "properties": {}
      },
      "dataModelName": {
         "type": "string"
      },
      "order": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "opacity": {
         "type": "number"
      },
      "hideLayer": {
         "type": "boolean"
      },
      "hideLegendLayerTitle": {
         "type": "boolean"
      },
      "namespacedConfig": {
         "type": "object",
         "properties": {
            "viz_map": {
               "type": "object",
               "properties": {
                  "mapLayerName": {
                     "type": "string"
                  },
                  "layerRenderType": {
                     "anyOf": [
                        {
                           "type": "string",
                           "const": "point"
                        },
                        {
                           "type": "string",
                           "const": "heatmap"
                        },
                        {
                           "type": "string",
                           "const": "cluster"
                        },
                        {
                           "type": "string",
                           "const": "polygon"
                        },
                        {
                           "type": "string",
                           "const": "line"
                        },
                        {
                           "type": "string",
                           "const": "dynamic_line"
                        }
                     ]
                  },
                  "showDefaultTooltip": {
                     "type": "boolean"
                  },
                  "useLastMatchCache": {
                     "type": "boolean"
                  },
                  "layerZoomLevels": {
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
                  "minZoomLevel": {
                     "type": "integer"
                  },
                  "maxZoomLevel": {
                     "type": "integer"
                  },
                  "layerEnableSelection": {
                     "type": "boolean"
                  },
                  "lastMatchCacheResults": {
                     "type": "object",
                     "properties": {},
                     "unevaluatedProperties": {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModel/mapColumnCache"
                     }
                  },
                  "dataLabelMultiline": {
                     "type": "boolean"
                  },
                  "dataLabelFont": {
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
                  },
                  "dataLabelHalo": {
                     "type": "string",
                     "const": "none"
                  },
                  "dataLabelOverlap": {
                     "type": "boolean"
                  },
                  "dataLabelPosition": {
                     "anyOf": [
                        {
                           "type": "string",
                           "const": "left"
                        },
                        {
                           "type": "string",
                           "const": "above"
                        },
                        {
                           "type": "string",
                           "const": "below"
                        },
                        {
                           "type": "string",
                           "const": "left"
                        },
                        {
                           "type": "string",
                           "const": "right"
                        },
                        {
                           "type": "string",
                           "const": "center"
                        },
                        {
                           "type": "string",
                           "const": "off"
                        }
                     ]
                  },
                  "dataLabelColumns": {
                     "type": "object",
                     "properties": {
                        "attributes": {
                           "type": "object",
                           "properties": {},
                           "unevaluatedProperties": {
                              "type": "boolean"
                           }
                        },
                        "measures": {
                           "type": "object",
                           "properties": {}
                        }
                     },
                     "additionalProperties": false
                  }
               },
               "additionalProperties": false
            }
         },
         "required": [
            "viz_map"
         ],
         "additionalProperties": false
      },
      "displayName": {
         "type": "string"
      }
   },
   "required": [
      "logicalDataModel",
      "dataModelName",
      "order"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModel/dataLayersInfo",
   "type": "object",
   "properties": {
      "dataLayers": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModel/dataLayers"
         }
      },
      "activeDataLayer": {
         "type": "string"
      }
   },
   "required": [
      "dataLayers",
      "activeDataLayer"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModel",
   "type": "object",
   "properties": {
      "dataLayersInfo": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModel/dataLayersInfo"
      },
      "logicalEdges": {
         "type": "object",
         "properties": {
            "measures": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "color": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "row": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "col": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "size": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "detail": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "glyph": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "item": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "grain": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "tile": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "tooltip": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "conditionalFormatting": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            },
            "related": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalDataModelEdges"
            }
         },
         "additionalProperties": false
      }
   },
   "required": [
      "logicalEdges"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers",
   "type": "object",
   "properties": {
      "type": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/edgeLayerTypes"
      },
      "isUsed": {
         "type": "boolean"
      },
      "columnID": {
         "type": "string"
      },
      "name": {
         "type": "string"
      },
      "userAdded": {
         "type": "boolean"
      },
      "visibility": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginViewVisibility"
      },
      "displaySubTotal": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/dataModels/displaySubTotal"
      },
      "duplicateID": {
         "type": "string"
      },
      "tags": {
         "type": "array",
         "items": {
            "type": "string"
         }
      },
      "aggRule": {
         "$ref": "http://oracle.com/bi/workbook/aggRules/0.0.0/"
      },
      "advancedAnalytics": {
         "type": "object",
         "properties": {
            "type": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "oracle.bi.tech.binby"
                  },
                  {
                     "type": "string",
                     "const": "oracle.bi.tech.cluster"
                  },
                  {
                     "type": "string",
                     "const": "oracle.bi.tech.measureagg"
                  },
                  {
                     "type": "string",
                     "const": "oracle.bi.tech.outlier"
                  }
               ]
            },
            "options": {
               "type": "object",
               "properties": {
                  "baseColumnFormula": {
                     "type": "string"
                  },
                  "byColumnFormulas": {
                     "type": "array",
                     "items": {
                        "type": "string"
                     }
                  },
                  "numberOfBins": {
                     "type": "integer",
                     "minimum": 0,
                     "maximum": 65535
                  },
                  "algorithm": {
                     "type": "string"
                  },
                  "numClusters": {
                     "type": "integer",
                     "minimum": 0,
                     "maximum": 65535
                  },
                  "aggFunction": {
                     "$ref": "http://oracle.com/bi/workbook/aggRules/0.0.0/"
                  },
                  "baseColumnID": {
                     "type": "string"
                  },
                  "columnFormula": {
                     "type": "string"
                  },
                  "isNumeric": {
                     "type": "boolean"
                  },
                  "overriddenColumnFormula": {
                     "type": "string"
                  },
                  "subjectArea": {
                     "type": "string"
                  },
                  "type": {
                     "type": "string",
                     "const": "attribute"
                  },
                  "trellisScope": {
                     "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/trellisScope"
                  }
               },
               "additionalProperties": false
            }
         },
         "required": [
            "type",
            "options"
         ],
         "additionalProperties": false
      },
      "columnSort": {
         "type": "object",
         "properties": {
            "direction": {
               "$ref": "http://oracle.com/bi/direction/0.0.0/"
            },
            "order": {
               "type": "integer",
               "minimum": 0,
               "maximum": 65535
            },
            "measureSorts": {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers/sort"
               }
            },
            "byColumnID": {
               "type": "string"
            }
         },
         "additionalProperties": false
      },
      "showAs": {
         "type": "object",
         "properties": {
            "type": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "values"
                  },
                  {
                     "type": "string",
                     "const": "percentOfAxis"
                  }
               ]
            },
            "axis": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "page"
                  },
                  {
                     "type": "string",
                     "const": "column"
                  }
               ]
            }
         },
         "required": [
            "type",
            "axis"
         ],
         "additionalProperties": false
      },
      "drillState": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/settingsLogicalEdgeLayers/drillState"
      }
   },
   "required": [
      "type"
   ],
   "additionalProperties": false
},{
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
}];
   return aSchemas;
} );
