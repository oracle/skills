# dataProfileColumn

- componentType: `dataProfileColumn`
- identifierRequired: true

## Properties

### advanced

- `hidden` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `common` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;
- `sourceDataType` — `<STRING>`; —; No; —; —; maxLength=255; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N`;

### source

- `sequence` — `<NUMBER>`; —; Yes; —; —; —; —;
- `type` — `<STRING>`; —; Yes; `DATA`; `<enum:[tableColumn:"Table Column", data:"Data", lookup:"Lookup", sqlExpression:"SQL Expression", sqlQuery:"SQL Query (return single value)"]>`; —; —;
- `primaryKey` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `parentColumn` — `<@dataProfileColumn>`; —; No; —; —; lovType=COMPONENT; `dataProfile[dataProfile.format] = json`;
- `lineNumber` — `<BOOLEAN>`; —; Yes; `N`; —; —; `dataProfileColumn[source.type] = data`;
- `dataType` — `<STRING>`; —; Yes; —; `<enum:[varchar2:"VARCHAR2", number:"NUMBER", date:"DATE", timestamp:"TIMESTAMP", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", clob:"CLOB", boolean:"BOOLEAN", blob:"BLOB", geometrySdoGeometry:"Geometry (SDO_GEOMETRY)", array:"Array", jsonDocument:"JSON Document"]>`; —; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N`;
- `maxLength` — `<INTEGER>`; —; Yes; `4000`; —; —; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and `dataProfileColumn[source.dataType] = varchar2`;

### identification (direct group)

- `columnName` — `<STRING>`; —; Yes; —; —; maxLength=128; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### parsing

- `selectorType` — `<STRING>`; —; Yes; `NAME`; `<enum:[name:"Name", sequence:"Sequence", regexp:"Regular Expression"]>`; —; `dataProfileColumn[source.type] = data` and (`dataProfile[dataProfile.format] = csv` or `dataProfile[dataProfile.format] = xlsx`);
- `tableColumn` — `<STRING>`; —; Yes; —; —; maxLength=128; `dataProfile[dataProfile.format] = json` and `dataProfileColumn[source.type] = tableColumn`;
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

- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `dataProfileColumn[source.type] = sqlExpression`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `dataProfileColumn[source.type] = sqlQuery`;

### transformation

- `type` — `<STRING>`; —; No; —; `<enum:[leftTrim:"Left Trim", rightTrim:"Right Trim", trim:"Trim", replace:"Replace", lower:"To Lower Case", upper:"To Upper Case", nullIf:"Null If", regexpReplace:"Regular Expression Replace", regexpNullIf:"Regular Expression Null If"]>`; —; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N`;
- `trimChars` — `<STRING>`; —; No; —; —; maxLength=4000; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and (`dataProfileColumn[transformation.type] = leftTrim` or `dataProfileColumn[transformation.type] = rightTrim` or `dataProfileColumn[transformation.type] = trim`);
- `find` — `<STRING>`; —; Yes; —; —; maxLength=4000; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and `dataProfileColumn[transformation.type] = replace`;
- `regexp` — `<STRING>`; —; Yes; —; —; maxLength=4000; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and (`dataProfileColumn[transformation.type] = regexpReplace` or `dataProfileColumn[transformation.type] = regexpNullIf`);
- `replaceWith` — `<STRING>`; —; No; —; —; maxLength=4000; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and (`dataProfileColumn[transformation.type] = replace` or `dataProfileColumn[transformation.type] = regexpReplace`);
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; `dataProfileColumn[source.type] = data` and `dataProfileColumn[source.lineNumber] = N` and `dataProfileColumn[transformation.type] = nullIf`;

