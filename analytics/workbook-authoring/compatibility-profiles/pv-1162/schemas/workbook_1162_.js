// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/1162/",
   "type": "object",
   "properties": {
      "projectVersion": {
         "type": "integer",
         "minimum": 1162,
         "maximum": 65535
      },
      "criteria": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/criteria"
      },
      "layouts": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/layouts"
      },
      "datasources": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/datasources"
      },
      "eventWiring": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/eventWiring"
      },
      "dataActions": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/dataActionEntry"
         },
         "minItems": 0
      },
      "nonDataActions": {
         "type": "array",
         "items": {
            "$ref": "http://oracle.com/bi/workbook/0.0.0/nonDataActionEntry"
         }
      },
      "sharedDataActions": {
         "$ref": "http://oracle.com/bi/workbook/1.0.0/sharedDataActions"
      },
      "views": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/views"
      },
      "reportConfig": {
         "type": "object",
         "properties": {}
      },
      "parameters": {
         "type": "object",
         "properties": {}
      },
      "filterControlCollections": {
         "type": "object",
         "properties": {}
      },
      "filterControlCollectionRef": {
         "$ref": "http://oracle.com/bi/filterControlCollectionRef/0.0.0/"
      },
      "snapshots": {
         "type": "object",
         "properties": {}
      },
      "stories": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/stories"
      },
      "annotations": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/annotations"
      },
      "folders": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/folders"
      },
      "aiAgents": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/aiagents"
      },
      "requestVariableParameterBindings": {
         "$ref": "http://oracle.com/bi/workbook/1.0.0/requestVariableParameterBindings"
      },
      "customSets": {
         "type": "object",
         "properties": {}
      },
      "mlmodels": {
         "$ref": "http://oracle.com/bi/workbook/0.0.0/mlmodels"
      }
   },
   "required": [
      "projectVersion",
      "criteria",
      "layouts"
   ],
   "additionalProperties": false
}];
   return aSchemas;
} );
