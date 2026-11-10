# column

- componentType: `column`
- identifierRequired: true
- appliesWhen: `lov[source.location] = localDatabase` or `lov[source.location] = restEnabledSql` or `lov[source.location] = jsonDualityView` or `lov[source.location] = jsonSource` or `lov[source.location] = restSource` or `lov[source.location] = sampleData`

## Properties

### advanced

- `searchable` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### identification (direct group)

- `columnName` — `<STRING>`; —; Yes; —; —; maxLength=128; —;
- `show` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### heading

- `heading` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### source

- `dataType` — `<STRING>`; —; Yes; —; `<enum:[varchar2:"VARCHAR2", number:"NUMBER", date:"DATE", timestamp:"TIMESTAMP", timestampWithTimeZone:"TIMESTAMP WITH TIME ZONE", timestampWithLocalTimeZone:"TIMESTAMP WITH LOCAL TIME ZONE", intervalYearToMonth:"INTERVAL YEAR TO MONTH", intervalDayToSecond:"INTERVAL DAY TO SECOND", clob:"CLOB", blob:"BLOB", boolean:"BOOLEAN", rowid:"ROWID", bfile:"BFILE", sdoGeometry:"SDO_GEOMETRY"]>`; maxLength=128; —;

### layout

- `sequence` — `<NUMBER>`; Enter the display sequence for this column. The sequence setting determines where this column is displayed in relation to other columns within the list of values. Note: If two columns, within the same list of values, have the same sequence value then they may be displayed in a different order when the application is exported and imported into another environment, such as a test or production environment. To ensure consistency, Oracle recommends you specify unique sequence numbers for every item, or at least for those within the same list of values.; Yes; —; —; —; —;

### appearance

- `formatMask` — `<STRING>`; —; No; —; —; maxLength=255; `column[source.dataType] = date` or `column[source.dataType] = timestamp` or `column[source.dataType] = timestampWithTimeZone` or `column[source.dataType] = timestampWithLocalTimeZone` or `column[source.dataType] = number`;

