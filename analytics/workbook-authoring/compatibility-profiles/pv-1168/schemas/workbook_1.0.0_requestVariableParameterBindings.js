// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/1.0.0/requestVariableParameterBindings",
   "type": "object",
   "properties": {
      "_version": {
         "type": "string",
         "const": "1.0.0"
      },
      "settings": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/VariableParameterBindingsSettings"
         }
      }
   },
   "required": [
      "_version",
      "settings"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
