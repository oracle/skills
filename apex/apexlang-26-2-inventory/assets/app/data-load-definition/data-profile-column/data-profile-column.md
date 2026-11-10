# dataProfileColumn

- componentType: `dataProfileColumn`
- identifierRequired: true

## Properties

### source

- `type` — `<STRING>`; —; Yes; `DATA`; `<enum:[data:"Data", lookup:"Lookup", sqlExpression:"SQL Expression", sqlQuery:"SQL Query (return single value)"]>`; —; —;
- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `primaryKey` — `<BOOLEAN>`; Determines whether this is a primary key column. A primary key can consist of multiple columns.; Yes; `N`; —; —; —;
- `lineNumber` — `<BOOLEAN>`; —; Yes; `N`; —; —; `dataProfileColumn[source.type] = data`;
- `dataType` — `<STRING>`; —; Yes; —; `<enum:[varchar2:"VARCHAR2", number:"NUMBER", date:"DATE", timestamp:"TIMESTAMP", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", clob:"CLOB", boolean:"BOOLEAN", blob:"BLOB", geometrySdoGeometry:"Geometry (SDO_GEOMETRY)", array:"Array", jsonDocument:"JSON Document"]>`; —; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N`;
- `maxLength` — `<INTEGER>`; —; Yes; `4000`; —; —; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and `dataProfileColumn[source.dataType] = varchar2`;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### identification (direct group)

- `columnName` — `<STRING>`; Name under which the column is exposed to Oracle APEX components.     If the data profile is part of a Data Load Definition, this name is used to map data profile columns to the target table. For instance, the ENAME data profile column will be loaded to the ENAME column of the target table. If the profile column does not exist in the target table, it will be ignored during data load.; Yes; —; —; maxLength=128; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### parsing

- `selectorType` — `<STRING>`; —; Yes; `NAME`; `<enum:[name:"Name", sequence:"Sequence", regexp:"Regular Expression"]>`; —; `dataProfileColumn[source.type] = data` and (`dataProfile[dataProfile.format] = csv` or `dataProfile[dataProfile.format] = xlsx`);
- `selector` — `<STRING>`; —; Yes; —; —; maxLength=255; `dataProfileColumn[source.type] = data` and (`dataProfile[dataProfile.format] = csv` or `dataProfile[dataProfile.format] = xlsx`) and (`dataProfileColumn[parsing.selectorType] = name` or `dataProfileColumn[parsing.selectorType] = regexp`);
- `columnNumber` — `<INTEGER>`; —; Yes; —; —; —; `dataProfileColumn[source.type] = data` and `dataProfileColumn[parsing.selectorType] = sequence` and (`dataProfile[dataProfile.format] = csv` or `dataProfile[dataProfile.format] = xlsx`);
- `pathExpression` — `<STRING>`; —; Yes; —; —; maxLength=255; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and (`dataProfile[dataProfile.format] = json` or `dataProfile[dataProfile.format] = xml`);
- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and (`dataProfileColumn[source.dataType] = number` or `dataProfileColumn[source.dataType] = date` or `dataProfileColumn[source.dataType] = timestamp` or `dataProfileColumn[source.dataType] = timestampWithTimeZone` or `dataProfileColumn[source.dataType] = timestampWithLocalTimeZone`);
- `hasTimeZone` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and (`dataProfileColumn[source.dataType] = date` or `dataProfileColumn[source.dataType] = timestamp` or `dataProfileColumn[source.dataType] = timestampWithTimeZone` or `dataProfileColumn[source.dataType] = timestampWithLocalTimeZone`);
- `decimalChar` — `<STRING>`; —; No; —; —; maxLength=1; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and `dataProfileColumn[source.dataType] = number`;
- `groupChar` — `<STRING>`; —; No; —; —; maxLength=1; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and `dataProfileColumn[source.dataType] = number`;

### lookup

- `tableOwner` — `<STRING>`; —; No; —; —; —; `dataProfileColumn[source.type] = lookup`;
- `tableName` — `<STRING>`; —; Yes; —; —; maxLength=128; `dataProfileColumn[source.type] = lookup`;
- `returnColumn` — `<STRING>`; —; Yes; —; —; —; `dataProfileColumn[source.type] = lookup`;
- `whereClause` — `<STRING>`; —; No; —; —; maxLength=4000; `dataProfileColumn[source.type] = lookup`;
- `tableColumn1` — `<STRING>`; —; Yes; —; —; —; `dataProfileColumn[source.type] = lookup`;
- `dataColumn1` — `<STRING>`; —; Yes; —; —; —; `dataProfileColumn[source.type] = lookup`;
- `tableColumn2` — `<STRING>`; —; No; —; —; —; `dataProfileColumn[source.type] = lookup` and `dataProfileColumn[lookup.tableColumn1] = sample`;
- `dataColumn2` — `<STRING>`; —; Yes; —; —; —; `dataProfileColumn[source.type] = lookup` and `dataProfileColumn[lookup.tableColumn1] = sample` and `dataProfileColumn[lookup.tableColumn2] = sample`;
- `tableColumn3` — `<STRING>`; —; No; —; —; —; `dataProfileColumn[source.type] = lookup` and `dataProfileColumn[lookup.tableColumn1] = sample` and `dataProfileColumn[lookup.tableColumn2] = sample`;
- `dataColumn3` — `<STRING>`; —; Yes; —; —; —; `dataProfileColumn[source.type] = lookup` and `dataProfileColumn[lookup.tableColumn1] = sample` and `dataProfileColumn[lookup.tableColumn2] = sample` and `dataProfileColumn[lookup.tableColumn3] = sample`;

### computation

- `sqlExpression` — `<STRING>`; Enter the SQL Expression to compute the value of this column. The SQL expression can reference data profile columns of the Data column type.; Yes; —; —; maxLength=4000; `dataProfileColumn[source.type] = sqlExpression`;
- `sqlQuery` — `<STRING>`; Enter the SQL Query to compute the value of this column. The SQL query must return a single value and can reference data profile columns of the Data column type.; Yes; —; —; maxLength=4000; `dataProfileColumn[source.type] = sqlQuery`;

### transformation

- `type` — `<STRING>`; —; No; —; `<enum:[leftTrim:"Left Trim", rightTrim:"Right Trim", trim:"Trim", replace:"Replace", lower:"To Lower Case", upper:"To Upper Case", nullIf:"Null If", regexpReplace:"Regular Expression Replace", regexpNullIf:"Regular Expression Null If"]>`; —; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N`;
- `trimChars` — `<STRING>`; —; No; —; —; maxLength=4000; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and (`dataProfileColumn[transformation.type] = leftTrim` or `dataProfileColumn[transformation.type] = rightTrim` or `dataProfileColumn[transformation.type] = trim`);
- `find` — `<STRING>`; —; Yes; —; —; maxLength=4000; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and `dataProfileColumn[transformation.type] = replace`;
- `regexp` — `<STRING>`; —; Yes; —; —; maxLength=4000; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and (`dataProfileColumn[transformation.type] = regexpReplace` or `dataProfileColumn[transformation.type] = regexpNullIf`);
- `replaceWith` — `<STRING>`; —; No; —; —; maxLength=4000; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and (`dataProfileColumn[transformation.type] = replace` or `dataProfileColumn[transformation.type] = regexpReplace`);
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and `dataProfileColumn[transformation.type] = nullIf`;

