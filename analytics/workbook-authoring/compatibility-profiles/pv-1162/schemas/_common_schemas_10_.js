// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
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
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/rowAxis/style",
   "type": "object",
   "properties": {
      "cursor": {
         "type": "string"
      },
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/taskDefaults",
   "type": "object",
   "properties": {
      "labelPosition": {
         "anyOf": [
            {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/taskDefaults/dataLabelPositionEnum"
            },
            {
               "type": "array",
               "items": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/taskDefaults/dataLabelPositionEnum"
               }
            }
         ]
      },
      "overlap": {
         "type": "object",
         "properties": {
            "behavior": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/taskDefaults/overlap/behaviorEnum"
            }
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/ganttchart/taskDefaults/overlap/behaviorEnum",
   "type": "string",
   "enum": [
      "auto",
      "overlay",
      "stack",
      "stagger"
   ]
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/gauge",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "gaugeType": {
               "type": "string"
            },
            "valueSettings": {
               "type": "object",
               "properties": {
                  "valueFont": {
                     "$ref": "http://oracle.com/bi/font/0.0.0/object"
                  },
                  "showValueLabel": {
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
                  "minValueLabel": {
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
                  "maxValueLabel": {
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
                  "minValue": {
                     "anyOf": [
                        {
                           "type": "number"
                        },
                        {
                           "type": "null"
                        }
                     ]
                  },
                  "maxValue": {
                     "anyOf": [
                        {
                           "type": "number"
                        },
                        {
                           "type": "null"
                        }
                     ]
                  },
                  "valueLabelPosition": {
                     "anyOf": [
                        {
                           "type": "string",
                           "const": "off"
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
                           "const": "insideLeft"
                        },
                        {
                           "type": "string",
                           "const": "insideRight"
                        },
                        {
                           "type": "string",
                           "const": "topLeft"
                        },
                        {
                           "type": "string",
                           "const": "topRight"
                        },
                        {
                           "type": "string",
                           "const": "bottomLeft"
                        },
                        {
                           "type": "string",
                           "const": "bottomRight"
                        }
                     ]
                  }
               },
               "additionalProperties": false
            },
            "targetLabelDisplaySettings": {
               "type": "object",
               "properties": {},
               "unevaluatedProperties": {}
            },
            "rangeLabelsSettings": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/gaugeRangeLabelsSettings"
            },
            "targetTickmarkColor": {
               "type": "object",
               "properties": {},
               "unevaluatedProperties": {
                  "type": "string"
               }
            },
            "barGaugeLength": {
               "type": "string"
            },
            "barGaugeCustomLength": {
               "type": "number"
            },
            "barGaugeThickness": {
               "type": "string"
            },
            "barGaugeCustomThickness": {
               "type": "number"
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/gaugeRangeLabelsSettings",
   "type": "object",
   "properties": {
      "rangeLabelsDisplay": {
         "anyOf": [
            {
               "type": "string",
               "const": "startEnd"
            },
            {
               "type": "string",
               "const": "all"
            },
            {
               "type": "string",
               "const": "none"
            }
         ]
      },
      "rangeLabelsStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "rangeLabelsNumberFormat": {
         "type": "object",
         "properties": {
            "typeID": {
               "type": "string",
               "const": "numberFormatterGadget"
            },
            "value": {
               "type": "string",
               "const": "auto"
            },
            "style": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "auto"
                  },
                  {
                     "type": "string",
                     "const": "decimal"
                  },
                  {
                     "type": "string",
                     "const": "percent"
                  },
                  {
                     "type": "string",
                     "const": "same_as_measure"
                  },
                  {
                     "type": "string",
                     "const": "currency"
                  }
               ]
            },
            "currency": {
               "$ref": "http://oracle.com/bi/currency/0.0.0/"
            },
            "useGrouping": {
               "type": "boolean"
            },
            "minimumIntegerDigits": {
               "type": "integer",
               "minimum": 0,
               "maximum": 255
            },
            "minimumFractionDigits": {
               "type": "integer",
               "minimum": 0,
               "maximum": 255
            },
            "maximumFractionDigits": {
               "type": "integer",
               "minimum": 0,
               "maximum": 255
            },
            "useAbbreviation": {
               "type": "boolean"
            },
            "bIsNested": {
               "type": "boolean"
            },
            "customCurrency": {
               "anyOf": [
                  {
                     "type": "null"
                  },
                  {
                     "type": "object",
                     "properties": {
                        "type": {
                           "type": "string",
                           "const": "currency_lookup"
                        },
                        "value": {
                           "type": "string"
                        }
                     },
                     "required": [
                        "type",
                        "value"
                     ],
                     "additionalProperties": false
                  }
               ]
            },
            "abbreviationScale": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "off"
                  },
                  {
                     "type": "string",
                     "const": "on"
                  },
                  {
                     "type": "string",
                     "const": "thousand"
                  },
                  {
                     "type": "string",
                     "const": "million"
                  },
                  {
                     "type": "string",
                     "const": "billion"
                  },
                  {
                     "type": "string",
                     "const": "trillion"
                  }
               ]
            },
            "negativeValuesStyle": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "default"
                  },
                  {
                     "type": "string",
                     "const": "accounting"
                  },
                  {
                     "type": "string",
                     "const": "red"
                  },
                  {
                     "type": "string",
                     "const": "red_accounting"
                  }
               ]
            },
            "currencyDisplay": {
               "type": "string",
               "const": "symbol"
            }
         },
         "additionalProperties": false
      },
      "barGaugeRangeLabelsPosition": {
         "anyOf": [
            {
               "type": "string",
               "const": "start"
            },
            {
               "type": "string",
               "const": "end"
            }
         ]
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/headerProperties",
   "type": "object",
   "properties": {
      "useValue": {
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
      "headerText": {
         "type": "string"
      }
   },
   "required": [
      "useValue",
      "headerText"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/hideCondition",
   "type": "object",
   "properties": {
      "parameter": {
         "type": "string"
      },
      "aSelectedValues": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/selectedValues"
         }
      },
      "eCondition": {
         "anyOf": [
            {
               "type": "string",
               "const": "any"
            },
            {
               "type": "string",
               "const": "subset"
            },
            {
               "type": "string",
               "const": "exactMatch"
            },
            {
               "type": "string",
               "const": "superset"
            }
         ]
      }
   },
   "required": [
      "parameter",
      "aSelectedValues"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/selectedValues",
   "type": "object",
   "properties": {
      "vValue": {
         "type": "string"
      },
      "sDisplayValue": {
         "type": "string"
      }
   },
   "required": [
      "vValue",
      "sDisplayValue"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/iframe",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "sourceType": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "SRCDOC"
                  },
                  {
                     "type": "string",
                     "const": "SRC"
                  }
               ]
            },
            "frameSrc": {
               "type": "string"
            },
            "allowScripts": {
               "type": "boolean"
            },
            "allowForms": {
               "type": "boolean"
            },
            "allowSameOrigin": {
               "type": "boolean"
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/MthStartValue",
   "type": "object",
   "properties": {
      "label": {
         "anyOf": [
            {
               "type": "string",
               "const": "standardview"
            },
            {
               "type": "string",
               "const": "startandendonly"
            }
         ]
      },
      "orientation": {
         "anyOf": [
            {
               "type": "string",
               "const": "left"
            },
            {
               "type": "string",
               "const": "right"
            }
         ]
      },
      "tickLabel": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "title": {
         "type": "object",
         "properties": {
            "useValue": {
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
            "value": {
               "type": "string"
            }
         },
         "required": [
            "useValue"
         ],
         "additionalProperties": false
      },
      "titleStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/"
      }
   },
   "required": [
      "label",
      "orientation"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/nodeDefaultsHeader",
   "type": "object",
   "properties": {
      "header": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/nodeDefaultsLabelStyle"
      }
   },
   "required": [
      "header"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/nodeDefaultsLabelStyle",
   "type": "object",
   "properties": {
      "labelStyle": {
         "anyOf": [
            {
               "$ref": "http://oracle.com/bi/font/0.0.0/"
            },
            {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            }
         ]
      }
   },
   "required": [
      "labelStyle"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/numberFormat",
   "type": "object",
   "properties": {
      "typeID": {
         "type": "string",
         "const": "numberFormatterGadget"
      },
      "value": {
         "type": "string",
         "const": "auto"
      },
      "style": {
         "anyOf": [
            {
               "type": "string",
               "const": "decimal"
            },
            {
               "type": "string",
               "const": "percent"
            },
            {
               "type": "string",
               "const": "same_as_measure"
            },
            {
               "type": "string",
               "const": "currency"
            }
         ]
      },
      "currency": {
         "$ref": "http://oracle.com/bi/currency/0.0.0/"
      },
      "useGrouping": {
         "type": "boolean"
      },
      "minimumIntegerDigits": {
         "type": "integer",
         "minimum": 0,
         "maximum": 255
      },
      "minimumFractionDigits": {
         "type": "integer",
         "minimum": 0,
         "maximum": 255
      },
      "maximumFractionDigits": {
         "type": "integer",
         "minimum": 0,
         "maximum": 255
      },
      "useAbbreviation": {
         "type": "boolean"
      },
      "bIsNested": {
         "type": "boolean"
      },
      "customCurrency": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "object",
               "properties": {
                  "type": {
                     "type": "string",
                     "const": "currency_lookup"
                  },
                  "value": {
                     "type": "string"
                  }
               },
               "required": [
                  "type",
                  "value"
               ],
               "additionalProperties": false
            }
         ]
      },
      "abbreviationScale": {
         "anyOf": [
            {
               "type": "string",
               "const": "off"
            },
            {
               "type": "string",
               "const": "on"
            },
            {
               "type": "string",
               "const": "thousand"
            },
            {
               "type": "string",
               "const": "million"
            },
            {
               "type": "string",
               "const": "billion"
            },
            {
               "type": "string",
               "const": "trillion"
            }
         ]
      },
      "negativeValuesStyle": {
         "anyOf": [
            {
               "type": "string",
               "const": "default"
            },
            {
               "type": "string",
               "const": "accounting"
            },
            {
               "type": "string",
               "const": "red"
            },
            {
               "type": "string",
               "const": "red_accounting"
            }
         ]
      },
      "currencyDisplay": {
         "type": "string",
         "const": "symbol"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/parallelcoordinates",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "axes": {
               "type": "object",
               "properties": {
                  "MthStartValue": {
                     "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/MthStartValue"
                  }
               },
               "unevaluatedProperties": {
                  "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/parallelcoordinates/axes"
               }
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/parallelcoordinates/axes",
   "type": "object",
   "properties": {
      "orientation": {
         "type": "string",
         "const": "right"
      },
      "tickLabel": {
         "type": "object",
         "properties": {
            "style": {
               "$ref": "http://oracle.com/bi/style/0.0.0/"
            }
         },
         "required": [
            "style"
         ],
         "additionalProperties": false
      },
      "title": {
         "type": "object",
         "properties": {
            "useValue": {
               "type": "string",
               "const": "custom"
            },
            "value": {
               "type": "string"
            }
         },
         "required": [
            "useValue",
            "value"
         ],
         "additionalProperties": false
      },
      "titleStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/pivot",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "showHeaderLabel": {
               "type": "object",
               "properties": {
                  "row": {
                     "type": "boolean"
                  },
                  "column": {
                     "type": "boolean"
                  }
               },
               "additionalProperties": false
            },
            "sizeInfo": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfo"
            },
            "total": {
               "type": "object",
               "properties": {
                  "position": {
                     "type": "object",
                     "properties": {
                        "row": {
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
                        },
                        "column": {
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
                     "additionalProperties": false
                  }
               },
               "required": [
                  "position"
               ],
               "additionalProperties": false
            },
            "unfreezeHeaders": {
               "type": "object",
               "properties": {
                  "row": {
                     "type": "boolean"
                  },
                  "column": {
                     "type": "boolean"
                  }
               },
               "additionalProperties": false
            }
         },
         "additionalProperties": false
      }
   },
   "required": [
      "settings"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
