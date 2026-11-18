# jsonDualityView

- componentType: `jsonDualityView`
- identifierRequired: true
- filePath: `shared-components/duality-view-sources/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a name of the JSON Duality View Source.; Yes; —; —; maxLength=255; —;

### advanced

- `staticId` — `<STRING>`; Use the Static ID to reference the JSON Duality View Source in API Calls.; Yes; —; —; maxLength=255; —;
- `xmlNamespaces` — `<STRING>`; —; No; —; —; maxLength=4000; `dataProfile[dataProfile.format] = xml`;
- `csvSeparator` — `<STRING>`; —; No; —; —; maxLength=5; `dataProfile[dataProfile.format] = csv`;
- `csvEnclosedBy` — `<STRING>`; —; No; —; —; maxLength=1; `dataProfile[dataProfile.format] = csv`;
- `defaultXlsxSheetName` — `<STRING>`; —; No; —; —; maxLength=255; `dataProfile[dataProfile.format] = xlsx`;
- `skipRows` — `<NUMBER>`; —; No; —; —; —; `dataProfile[dataProfile.format] = csv` or `dataProfile[dataProfile.format] = xlsx`;
- `firstLineContainsHeaders` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `dataProfile[dataProfile.format] = csv` or `dataProfile[dataProfile.format] = xlsx`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### source

- `location` — `<STRING>`; —; Yes; —; `<enum:[localDatabase:"Local Database", restEnabledSql:"REST Enabled SQL"]>`; —; —;
- `tableOwner` — `<STRING>`; Select the schema that owns the data source.; No; —; —; —; —;
- `tableName` — `<STRING>`; Enter the case-sensitive JSON duality view name. You can type in the name or pick from the list.; Yes; —; —; maxLength=128; —;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; `jsonDualityView[source.location] = restEnabledSql`;

### subscription

- `master` — `<@jsonDualityView>`; —; No; —; —; lovType=COMPONENT; —;

### dataProfile

- `format` — `<STRING>`; —; Yes; `JSON`; `<enum:[csv:"CSV", json:"JSON", xlsx:"XLSX", xml:"XML"]>`; —; —;
- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `rowSelector` — `<STRING>`; —; No; —; —; maxLength=255; `dataProfile[dataProfile.format] = json` or `dataProfile[dataProfile.format] = xml`;
- `useRawSelectors` — `<BOOLEAN>`; —; Yes; `N`; —; —; `dataProfile[dataProfile.format] = json`;

### remoteCache

- `caching` — `<STRING>`; —; No; —; `<enum:[allUsers:"For All Users", user:"By User", session:"By Session"]>`; —; `jsonDualityView[source.location] = restEnabledSql`;
- `timeout` — `<STRING>`; —; No; —; —; maxLength=255; `jsonDualityView[source.location] = restEnabledSql` and `jsonDualityView[remoteCache.caching] = sample`;

