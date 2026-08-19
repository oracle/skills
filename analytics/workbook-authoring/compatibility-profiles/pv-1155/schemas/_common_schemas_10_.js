// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
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
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfo",
   "type": "object",
   "properties": {
      "nestedVizHeight": {
         "type": "number",
         "minimum": 0
      },
      "relatedSlices": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfoEntry"
         }
      },
      "columns": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfoEntry"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfoEntry",
   "type": "object",
   "properties": {
      "width": {
         "type": "number",
         "minimum": 0
      }
   },
   "required": [
      "width"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfoTable",
   "type": "object",
   "properties": {
      "nestedVizHeight": {
         "type": "number",
         "minimum": 0
      },
      "relatedSlices": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "number"
         }
      },
      "columns": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "type": "number"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/spacer",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "line": {
               "type": "boolean"
            },
            "color": {
               "type": "string"
            },
            "align": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "center right"
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
                     "const": "center left"
                  },
                  {
                     "type": "string",
                     "const": "center"
                  },
                  {
                     "type": "string",
                     "const": "right top"
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
            "width": {
               "type": "integer",
               "minimum": -2147483648,
               "maximum": 2147483647
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
                  }
               ]
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/standalonelegend",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "orientation": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "vertical"
                  },
                  {
                     "type": "string",
                     "const": "horizontal"
                  }
               ]
            },
            "alignment": {
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
            }
         },
         "required": [
            "orientation",
            "alignment"
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/table",
   "type": "object",
   "properties": {
      "settings": {
         "type": "object",
         "properties": {
            "groupRows": {
               "type": "boolean"
            },
            "duplicateRows": {
               "type": "boolean"
            },
            "sizeInfo": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/sizeInfoTable"
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
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChart",
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
               "const": "line"
            }
         ]
      },
      "xAxis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis"
      },
      "yAxis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis"
      },
      "x2Axis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis"
      },
      "y2Axis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis"
      },
      "numberFormat": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/numberFormat"
      },
      "legend": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChart/legend"
      },
      "percentDecimalPlaces": {
         "type": "integer",
         "minimum": 0,
         "maximum": 255
      },
      "aspectRatioLocked": {
         "type": "boolean"
      },
      "showTitle": {
         "anyOf": [
            {
               "type": "string",
               "const": "none"
            },
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
      "showTitleTooltip": {
         "anyOf": [
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
      "titleTooltip": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/"
      },
      "useTitleInTooltip": {
         "type": "boolean"
      },
      "hideAndShowBehavior": {
         "type": "string",
         "const": "withRescale"
      },
      "hoverBehavior": {
         "type": "string",
         "const": "dim"
      },
      "selectionMode": {
         "type": "string",
         "const": "multiple"
      },
      "drilling": {
         "type": "string",
         "const": "on"
      },
      "animationOnDataChange": {
         "type": "string",
         "const": "auto"
      },
      "coordinateSystem": {
         "type": "string",
         "const": "cartesian"
      },
      "stack": {
         "type": "string",
         "const": "off"
      },
      "showTotal": {
         "type": "boolean"
      },
      "treatNullsAs": {
         "anyOf": [
            {
               "type": "string",
               "const": "zero"
            },
            {
               "type": "string",
               "const": "gap"
            }
         ]
      },
      "stackLabel": {
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
      "labelStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "textStyle": {
         "$ref": "http://oracle.com/bi/font/0.0.0/object"
      },
      "preventTimeAxisBarOverlap": {
         "type": "boolean"
      },
      "dateTimeLabels": {
         "type": "boolean"
      },
      "horizontalAlignment": {
         "anyOf": [
            {
               "type": "string",
               "const": "auto"
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
            }
         ]
      },
      "dataValues": {
         "type": "boolean"
      },
      "transparency": {
         "type": "integer"
      },
      "zoomAndScroll": {
         "anyOf": [
            {
               "type": "string",
               "const": "off"
            },
            {
               "type": "string",
               "const": "live"
            }
         ]
      },
      "viz_map": {
         "type": "object",
         "properties": {
            "viewport": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizMapViewport"
            },
            "_settingsVersion": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "0.0.0"
                  },
                  {
                     "type": "string",
                     "const": "1.0.0"
                  }
               ]
            },
            "detectLatLongForTextColumns": {
               "type": "boolean"
            },
            "forceLegacyMapviewerRenderer": {
               "type": "boolean"
            },
            "repeatBackground": {
               "type": "boolean"
            },
            "autoFocusOnData": {
               "type": "boolean"
            },
            "zoomControlEnabled": {
               "type": "boolean"
            },
            "scaleBarUnit": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "BOTH"
                  },
                  {
                     "type": "string",
                     "const": "IMPERIAL"
                  },
                  {
                     "type": "string",
                     "const": "METRIC"
                  },
                  {
                     "type": "string",
                     "const": "NONE"
                  }
               ]
            },
            "tileLayerType": {
               "type": "string"
            },
            "mouseWheelZoomingEnabled": {
               "type": "boolean"
            },
            "_defaultTileBackground": {
               "type": "string",
               "const": "elocation"
            },
            "_useMaxBoundsForMapboxViewport": {
               "type": "boolean"
            },
            "backgroundMapsConfig": {
               "type": "object",
               "properties": {
                  "oracle_osm": {
                     "type": "object",
                     "properties": {
                        "tileLayer": {
                           "anyOf": [
                              {
                                 "type": "string",
                                 "const": "osm_darkmatter"
                              },
                              {
                                 "type": "string",
                                 "const": "osm_bright"
                              },
                              {
                                 "type": "string",
                                 "const": "osm_positron"
                              }
                           ]
                        }
                     },
                     "required": [
                        "tileLayer"
                     ],
                     "additionalProperties": false
                  },
                  "oracle_dataviz_osm": {
                     "type": "object",
                     "properties": {
                        "tileLayer": {
                           "anyOf": [
                              {
                                 "type": "string",
                                 "const": "dataviz-default-thematic"
                              },
                              {
                                 "type": "string",
                                 "const": "dataviz-bright"
                              },
                              {
                                 "type": "string",
                                 "const": "dataviz-light"
                              },
                              {
                                 "type": "string",
                                 "const": "dataviz-dark"
                              }
                           ]
                        }
                     },
                     "required": [
                        "tileLayer"
                     ],
                     "additionalProperties": false
                  }
               },
               "additionalProperties": false
            }
         },
         "additionalProperties": false
      },
      "dataLabels": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChart/dataLabels"
      },
      "labels": {
         "type": "object",
         "properties": {
            "showPercent": {
               "type": "boolean"
            },
            "showValue": {
               "type": "boolean"
            },
            "showLabel": {
               "type": "boolean"
            }
         },
         "additionalProperties": false
      },
      "textContents": {
         "$ref": "http://oracle.com/bi/caption/0.0.0/"
      },
      "styleDefaults": {
         "type": "object",
         "properties": {
            "lineType": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "none"
                  },
                  {
                     "type": "string",
                     "const": "stepped"
                  },
                  {
                     "type": "string",
                     "const": "curved"
                  },
                  {
                     "type": "string",
                     "const": "straight"
                  },
                  {
                     "type": "string",
                     "const": "centeredStepped"
                  },
                  {
                     "type": "string",
                     "const": "segmented"
                  },
                  {
                     "type": "string",
                     "const": "centerSegmented"
                  },
                  {
                     "type": "string",
                     "const": "centeredSegmented"
                  }
               ]
            },
            "lineWidth": {
               "type": "number"
            },
            "lineStyle": {
               "$ref": "http://oracle.com/bi/lineStyle/0.0.0/"
            },
            "markerDisplayed": {
               "type": "string",
               "const": "on"
            },
            "seriesEffect": {
               "type": "string",
               "const": "color"
            },
            "animationDuration": {
               "type": "string"
            },
            "minorAxis": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMinorMajorAxis"
            },
            "majorAxis": {
               "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMinorMajorAxis"
            },
            "nodeDefaults": {
               "anyOf": [
                  {
                     "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/nodeDefaultsHeader"
                  },
                  {
                     "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/nodeDefaultsLabelStyle"
                  }
               ]
            },
            "dataLabelStyle": {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            },
            "stackLabelStyle": {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            },
            "selectionEffect": {
               "type": "string"
            },
            "barGapRatio": {
               "type": "number"
            }
         },
         "additionalProperties": false
      },
      "performanceTile_title_custom_text": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "$ref": "http://oracle.com/bi/caption/0.0.0/"
            }
         ]
      },
      "performanceTile_description_use_value": {
         "anyOf": [
            {
               "type": "string",
               "const": "none"
            },
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
      "performanceTile_description_custom_text": {
         "anyOf": [
            {
               "type": "string"
            },
            {
               "$ref": "http://oracle.com/bi/caption/0.0.0/"
            }
         ]
      },
      "performanceTile_description_style": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "performanceTile_value_style": {
         "$ref": "http://oracle.com/bi/style/0.0.0/"
      },
      "sparkChartType": {
         "anyOf": [
            {
               "type": "string",
               "const": "none"
            },
            {
               "type": "string",
               "const": "bar"
            },
            {
               "type": "string",
               "const": "area"
            },
            {
               "type": "string",
               "const": "line"
            },
            {
               "type": "string",
               "const": "lineWithArea"
            }
         ]
      },
      "pieInnerRadius": {
         "type": "number",
         "minimum": 0
      },
      "piechart_dataLabels": {
         "type": "object",
         "properties": {
            "show_percent": {
               "type": "boolean"
            },
            "show_value": {
               "type": "boolean"
            },
            "show_label": {
               "type": "boolean"
            }
         },
         "required": [
            "show_percent",
            "show_value",
            "show_label"
         ],
         "additionalProperties": false
      },
      "pieCenterLabel": {
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
      "MthStartValue": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/MthStartValue"
      },
      "dataCursorBehavior": {
         "type": "string",
         "const": "smooth"
      },
      "dataCursor": {
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
      "points": {
         "type": "object",
         "properties": {
            "size": {
               "type": "integer",
               "minimum": 0,
               "maximum": 255
            },
            "minSize": {
               "type": "integer",
               "minimum": 0,
               "maximum": 255
            },
            "maxSize": {
               "type": "integer",
               "minimum": 0,
               "maximum": 255
            },
            "minSizeOption": {
               "type": "string",
               "const": "custom"
            },
            "outline": {
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
                     "const": "custom"
                  }
               ]
            },
            "outlineColor": {
               "type": "string"
            },
            "lineType": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "none"
                  },
                  {
                     "type": "string",
                     "const": "straight"
                  },
                  {
                     "type": "string",
                     "const": "curved"
                  },
                  {
                     "type": "string",
                     "const": "stepped"
                  },
                  {
                     "type": "string",
                     "const": "segmented"
                  }
               ]
            },
            "fill": {
               "type": "boolean"
            }
         },
         "additionalProperties": false
      },
      "measures": {
         "type": "object",
         "properties": {},
         "unevaluatedProperties": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMeasures"
         }
      },
      "minorAxis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMinorMajorAxis"
      },
      "majorAxis": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartMinorMajorAxis"
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
            }
         ]
      },
      "nodeDefaults": {
         "type": "object",
         "properties": {
            "labelStyle": {
               "$ref": "http://oracle.com/bi/font/0.0.0/object"
            }
         },
         "additionalProperties": false
      },
      "overview": {
         "type": "object",
         "properties": {
            "height": {
               "type": "string"
            },
            "rendered": {
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
      },
      "unitsPerShape": {
         "type": "string"
      },
      "applySizeToStack": {
         "type": "boolean"
      },
      "linkType": {
         "anyOf": [
            {
               "type": "string",
               "const": "none"
            },
            {
               "type": "string",
               "const": "web"
            },
            {
               "type": "string",
               "const": "storypage"
            }
         ]
      },
      "linkAddress": {
         "type": "string"
      }
   },
   "unevaluatedProperties": {
      "anyOf": [
         {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/numberFormat"
         },
         {
            "$ref": "http://oracle.com/bi/workbook/aggRules/0.0.0/"
         }
      ]
   }
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis",
   "type": "object",
   "properties": {
      "minoption": {
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
               "const": "minData"
            }
         ]
      },
      "maxoption": {
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
               "const": "maxData"
            }
         ]
      },
      "min": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "number"
            }
         ]
      },
      "max": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "number"
            }
         ]
      },
      "viewportMin": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "number"
            }
         ]
      },
      "viewportMax": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "number"
            }
         ]
      },
      "minauto": {
         "type": "boolean"
      },
      "maxauto": {
         "type": "boolean"
      },
      "syncScales": {
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
      "titleInput": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "string"
            }
         ]
      },
      "title": {
         "anyOf": [
            {
               "type": "null"
            },
            {
               "type": "string"
            }
         ]
      },
      "titleStyle": {
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
            },
            "font": {
               "$ref": "http://oracle.com/bi/font/0.0.0/"
            }
         },
         "additionalProperties": false
      },
      "rendered": {
         "type": "string",
         "const": "off"
      },
      "scale": {
         "anyOf": [
            {
               "type": "string",
               "const": "log"
            },
            {
               "type": "string",
               "const": "linear"
            }
         ]
      },
      "useTitleValue": {
         "anyOf": [
            {
               "type": "string",
               "const": "none"
            },
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
      "format": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/numberFormat"
      },
      "majorTick": {
         "type": "object",
         "properties": {
            "rendered": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "on"
                  },
                  {
                     "type": "string",
                     "const": "off"
                  },
                  {
                     "type": "string",
                     "const": "auto"
                  }
               ]
            }
         },
         "required": [
            "rendered"
         ],
         "additionalProperties": false
      },
      "minorTick": {
         "type": "object",
         "properties": {
            "rendered": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "on"
                  },
                  {
                     "type": "string",
                     "const": "off"
                  },
                  {
                     "type": "string",
                     "const": "auto"
                  }
               ]
            }
         },
         "required": [
            "rendered"
         ],
         "additionalProperties": false
      },
      "tickLabel": {
         "type": "object",
         "properties": {
            "rendered": {
               "anyOf": [
                  {
                     "type": "string",
                     "const": "on"
                  },
                  {
                     "type": "string",
                     "const": "off"
                  },
                  {
                     "type": "string",
                     "const": "auto"
                  }
               ]
            },
            "style": {
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
                  },
                  "font": {
                     "$ref": "http://oracle.com/bi/font/0.0.0/"
                  }
               },
               "additionalProperties": false
            }
         },
         "additionalProperties": false
      },
      "axisLine": {
         "type": "object",
         "properties": {
            "rendered": {
               "type": "string",
               "const": "off"
            }
         },
         "additionalProperties": false
      },
      "referenceObjects": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis/referenceObjects"
         }
      }
   },
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/viewConfigSettings/vizChartAxis/referenceObjects",
   "type": "object",
   "properties": {
      "_function": {
         "anyOf": [
            {
               "type": "string",
               "const": "avg"
            },
            {
               "type": "string",
               "const": "max"
            }
         ]
      },
      "_functionFrom": {
         "type": "string",
         "const": "min"
      },
      "_functionTo": {
         "type": "string",
         "const": "max"
      },
      "_id": {
         "type": "string"
      },
      "_measureId": {
         "type": "string"
      },
      "_trellisScope": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/pluginView/trellisScope"
      },
      "_type": {
         "type": "string",
         "const": "reference"
      },
      "type": {
         "anyOf": [
            {
               "type": "string",
               "const": "area"
            },
            {
               "type": "string",
               "const": "line"
            }
         ]
      }
   },
   "required": [
      "_function",
      "_functionFrom",
      "_functionTo",
      "_id",
      "_measureId",
      "_trellisScope",
      "_type",
      "type"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
