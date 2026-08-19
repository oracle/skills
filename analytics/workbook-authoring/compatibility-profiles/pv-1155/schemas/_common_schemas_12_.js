// Copyright (C) 1997, 2026, Oracle and/or its affiliates.

define( function () {
   const aSchemas =[{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/drillParents",
   "type": "object",
   "properties": {
      "columnID": {
         "type": "string"
      },
      "levelID": {
         "type": "string"
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
      }
   },
   "required": [
      "columnID",
      "levelID",
      "members"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/QDRChildren/hierarchyMembers",
   "type": "object",
   "properties": {
      "hierarchyLevel": {
         "type": "object",
         "properties": {
            "levelID": {
               "type": "string"
            }
         },
         "required": [
            "levelID"
         ],
         "additionalProperties": false
      },
      "members": {
         "type": "object",
         "properties": {
            "children": {
               "type": "array",
               "items": {
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
               }
            },
            "type": {
               "type": "string",
               "const": "saw:untypedMembers"
            }
         },
         "required": [
            "children",
            "type"
         ],
         "additionalProperties": false
      }
   },
   "required": [
      "hierarchyLevel",
      "members"
   ],
   "additionalProperties": false
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/QDRChildren/members",
   "type": "object",
   "properties": {
      "children": {
         "type": "array",
         "items": {
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
               "const": "saw:dateMembers"
            },
            {
               "type": "string",
               "const": "saw:timeMembers"
            },
            {
               "type": "string",
               "const": "saw:dateTimeMembers"
            },
            {
               "type": "string",
               "const": "saw:integerMembers"
            },
            {
               "type": "string",
               "const": "saw:decimalMembers"
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
},{
   "$schema": "https://json-schema.org/draft/2020-12/schema",
   "$id": "http://oracle.com/bi/workbook/0.0.0/views/drillStateChildren/selectionGroupsChildren",
   "type": "object",
   "properties": {
      "columnID": {
         "type": "string"
      },
      "groupID": {
         "type": "integer",
         "minimum": 0,
         "maximum": 65535
      }
   },
   "required": [
      "columnID",
      "groupID"
   ]
}];
   return aSchemas;
} );
