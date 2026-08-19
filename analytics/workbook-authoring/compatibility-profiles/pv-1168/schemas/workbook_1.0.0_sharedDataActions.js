// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/1.0.0/sharedDataActions",
   "type": "object",
   "properties": {
      "_version": {
         "type": "string",
         "const": "1.0.0"
      },
      "children": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/1.0.0/sharedDataActions/sharedDataAction"
         }
      }
   },
   "required": [
      "_version",
      "children"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
