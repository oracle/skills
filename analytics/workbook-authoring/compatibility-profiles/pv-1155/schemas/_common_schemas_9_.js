// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/barlineAreaChart/measureInfo",
   "type": "object",
   "properties": {
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "bar"
            },
            {
               "type": "string",
               "const": "line"
            },
            {
               "type": "string",
               "const": "area"
            },
            {
               "type": "string",
               "const": "scatter"
            }
         ]
      },
      "assignedToY2": {
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
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "buttonConfig": {
               "type": "object",
               "properties": {
                  "buttonOptions": {
                     "type": "object",
                     "properties": {},
                     "unevaluatedProperties": {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/ButtonOptions"
                     }
                  },
                  "nNextButtonIndex": {
                     "type": "integer"
                  },
                  "buttonStyle": {
                     "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/buttonbar/ButtonStyles"
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
                  },
                  "align": {
                     "anyOf": [
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
                           "const": "center"
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
                  "orientation": {
                     "anyOf": [
                        {
                           "type": "string",
                           "const": "horizontal"
                        },
                        {
                           "type": "string",
                           "const": "vertical"
                        },
                        {
                           "type": "string",
                           "const": "auto"
                        }
                     ]
                  },
                  "wrap": {
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
                  }
               },
               "additionalProperties": false
            }
         },
         "required": [
            "buttonConfig"
         ]
      }
   },
   "required": [
      "settings"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/canvassummaryviz",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "titleFont": {
               "$ref": "http://oracle.com/bi/font/0.0.0/"
            },
            "summaryFont": {
               "$ref": "http://oracle.com/bi/font/0.0.0/"
            },
            "viewTitleFont": {
               "$ref": "http://oracle.com/bi/font/0.0.0/"
            },
            "viewSummaryFont": {
               "$ref": "http://oracle.com/bi/font/0.0.0/"
            },
            "showViewDescriptions": {
               "type": "boolean"
            },
            "tone": {
               "type": "string"
            },
            "question": {
               "type": "string"
            },
            "_currentSummaryCacheID": {
               "type": "string"
            },
            "_currentSummaryCacheResult": {
               "type": "string"
            }
         },
         "additionalProperties": false
      }
   },
   "required": [
      "settings"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "dataLayersInfo": {
               "type": "object",
               "properties": {},
               "unevaluatedProperties": {
                  "anyOf": [
                     {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart/dataLayersInfoEnum"
                     },
                     {
                        "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart/dataLayersInfo"
                     }
                  ]
               }
            }
         },
         "required": [
            "dataLayersInfo"
         ],
         "additionalProperties": false
      }
   },
   "required": [
      "settings"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart/dataLayersInfo",
   "type": "object",
   "properties": {
      "type": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart/dataLayersInfoEnum"
      },
      "lineStyle": {
         "$ref": "http://oracle.com/bi/lineStyle/0.0.0/"
      },
      "customTooltip": {
         "type": "string"
      },
      "lineWidth": {
         "type": "number",
         "minimum": 0
      },
      "transparency": {
         "type": "number",
         "minimum": 0,
         "maximum": 100
      }
   },
   "required": [
      "type"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/comboMultiLayerChart/dataLayersInfoEnum",
   "type": "string",
   "enum": [
      "area",
      "bar",
      "line",
      "stackbar",
      "scatter",
      "stackedscatter",
      "stackbar100"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/conditionalFormatting",
   "type": "object",
   "properties": {
      "activeRules": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/conditionalFormattingRule"
         }
      },
      "enableRuleBlending": {
         "type": "boolean"
      },
      "ruleConfigs": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ruleConfig"
         }
      }
   },
   "required": [
      "activeRules"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/conditionalFormattingRule",
   "type": "object",
   "properties": {
      "ruleID": {
         "type": "string"
      },
      "generationID": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      },
      "field": {
         "type": "array",
         "items": {
            "type": "string"
         }
      }
   },
   "required": [
      "ruleID",
      "generationID",
      "field"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ruleConfig",
   "type": "object",
   "properties": {
      "ruleID": {
         "type": "string"
      },
      "applyTo": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "boolean"
         }
      },
      "icon": {
         "type": "object",
         "properties": {
            "columns": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ruleConfigIcon"
            },
            "tile": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ruleConfigIcon"
            }
         },
         "additionalProperties": false
      }
   },
   "required": [
      "ruleID"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ruleConfigIcon",
   "type": "object",
   "properties": {
      "position": {
         "anyOf": [
            {
               "type": "string",
               "const": "beforeValue"
            },
            {
               "type": "string",
               "const": "afterValue"
            },
            {
               "type": "string",
               "const": "iconOnly"
            }
         ]
      },
      "customSize": {
         "type": "number",
         "minimum": 0
      },
      "size": {
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
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/containerProperties",
   "type": "object",
   "properties": {
      "filterExclusions": {
         "type": "array",
         "items": {
            "type": "string"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/displayAsLinkSettings",
   "type": "object",
   "properties": {
      "displayAsLink": {
         "type": "boolean"
      },
      "defaultAction": {
         "type": "string"
      }
   },
   "required": [
      "displayAsLink"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/displayAsLinkSettingsProperties",
   "type": "object",
   "properties": {
      "displayAsLink": {
         "type": "boolean"
      },
      "defaultAction": {
         "type": "string"
      }
   },
   "required": [
      "displayAsLink"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/format",
   "type": "object",
   "properties": {
      "date": {
         "type": "object",
         "properties": {
            "format": {
               "type": "string"
            }
         },
         "required": [
            "format"
         ],
         "additionalProperties": false
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart",
   "type": "object",
   "properties": {
      "settings": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/settings"
      }
   },
   "required": [
      "settings"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/timeUnitInfo",
   "type": "object",
   "properties": {
      "durationTimeUnit": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/timeUnitInfoEnum"
      }
   },
   "required": [
      "durationTimeUnit"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/dataLabelEnum",
   "type": "string",
   "enum": [
      "none",
      "task",
      "duration"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/timeUnitInfoEnum",
   "type": "string",
   "enum": [
      "auto",
      "second",
      "minute",
      "hour",
      "day",
      "week",
      "month",
      "quarter",
      "year"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/gridLineOptionsEnum",
   "type": "string",
   "enum": [
      "auto",
      "hidden",
      "visible"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/taskDefaults/dataLabelPositionEnum",
   "type": "string",
   "enum": [
      "auto",
      "none",
      "start",
      "end",
      "innerStart",
      "innerCenter",
      "innerEnd"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/settings",
   "type": "object",
   "properties": {
      "dataLayersInfo": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/timeUnitInfo"
         }
      },
      "taskLabelPreference": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/dataLabelEnum"
      },
      "taskDefaults": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/taskDefaults"
      },
      "gridlines": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/gridlines"
      },
      "rowAxis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/rowAxis"
      },
      "axisPosition": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/axisPositionEnum"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/axisPositionEnum",
   "type": "string",
   "enum": [
      "top",
      "bottom"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/gridlines",
   "type": "object",
   "properties": {
      "horizontal": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/gridLineOptionsEnum"
      },
      "vertical": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/gridLineOptionsEnum"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/rowAxis",
   "type": "object",
   "properties": {
      "rendered": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/rowAxis/renderedEnum"
      },
      "style": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/rowAxis/style"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/rowAxis/renderedEnum",
   "type": "string",
   "enum": [
      "on",
      "off"
   ]
}];
   return aSchemas;
} );
