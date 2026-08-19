// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/1.0.0/sharedDataActions/sharedDataAction",
   "type": "object",
   "properties": {
      "reusableObjectID": {
         "type": "string"
      }
   },
   "required": [
      "reusableObjectID"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
