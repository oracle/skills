# dataLoadDefinition

- componentType: `dataLoadDefinition`
- identifierRequired: true
- filePath: `shared-components/data-load-definitions/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; The name for the data load definition.; Yes; —; —; maxLength=255; —;

### target

- `type` — `<STRING>`; —; Yes; `TABLE`; `<enum:[table:"Table", collection:"Collection"]>`; —; —;
- `tableOwner` — `<STRING>`; —; No; —; —; —; `dataLoadDefinition[target.type] = table`;
- `tableName` — `<STRING>`; —; Yes; —; —; maxLength=128; `dataLoadDefinition[target.type] = table`;
- `name` — `<STRING>`; —; Yes; —; —; maxLength=128, textCase=UPPER; `dataLoadDefinition[target.type] = collection`;
- `loadingMethod` — `<STRING>`; —; Yes; `APPEND`; `<enum:[append:"Append", merge:"Merge", replace:"Replace"]>`; —; `dataLoadDefinition[target.type] = table`;
- `loadingMethod` — `<STRING>`; —; Yes; `APPEND`; `<enum:[append:"Append", replace:"Replace"]>`; —; `dataLoadDefinition[target.type] = collection`;

### errorHandling

- `whenOnError` — `<STRING>`; —; Yes; `ABORT`; `<enum:[ignore:"Ignore", stop:"Stop", logErrorIntoCollection:"Log Error into Collection", logIntoErrorLog:"Log into Error Log"]>`; —; —;
- `name` — `<STRING>`; —; Yes; —; —; maxLength=128, textCase=UPPER; `dataLoadDefinition[errorHandling.whenOnError] = logErrorIntoCollection`;
- `tableName` — `<STRING>`; —; Yes; —; —; maxLength=128; `dataLoadDefinition[errorHandling.whenOnError] = logIntoErrorLog`;

### advanced

- `commitInterval` — `<INTEGER>`; —; No; —; —; —; —;
- `staticId` — `<STRING>`; Use the Static ID to reference the Data Load Definition in API Calls.; Yes; —; —; maxLength=255; —;
- `encoding` — `<STRING>`; —; No; —; `<enum:[iso-8859-6:"Arabic ISO-8859-6", windows-1256:"Arabic Windows 1256", big5:"Chinese Big5", gbk:"Chinese GBK", iso-8859-5:"Cyrillic ISO-8859-5", koi8-r:"Cyrillic KOI8-R", koi8-u:"Cyrillic KOI8-U", windows-1251:"Cyrillic Windows 1251", iso-8859-2:"Eastern European ISO-8859-2", windows-1250:"Eastern European Windows 1250", iso-8859-7:"Greek ISO-8859-7", windows-1253:"Greek Windows 1253", iso-8859-8-i:"Hebrew ISO-8859-8-i", windows-1255:"Hebrew Windows 1255", euc-jp:"Japanese EUC", shift-jis:"Japanese Shift JIS", euc-kr:"Korean EUC", iso-8859-4:"Northern European ISO-8859-4", windows-1257:"Northern European Windows 1257", iso-8859-3:"Southern European ISO-8859-3", tis-620:"Thai TIS-620", iso-8859-9:"Turkish ISO-8859-9", windows-1254:"Turkish Windows 1254", us-ascii:"US-ASCII", utf-16be:"Unicode UTF-16 Big Endian", utf-16le:"Unicode UTF-16 Little Endian", utf-8:"Unicode UTF-8", windows-1258:"Vietnamese Windows 1258", iso-8859-1:"Western European ISO-8859-1", windows-1252:"Western European Windows 1252"]>`; —; —;
- `numericChars` — `<STRING>`; —; No; —; —; maxLength=2; —;
- `xmlNamespaces` — `<STRING>`; —; No; —; —; maxLength=4000; `dataProfile[dataProfile.format] = xml`;
- `csvSeparator` — `<STRING>`; —; No; —; —; maxLength=5; `dataProfile[dataProfile.format] = csv`;
- `csvEnclosedBy` — `<STRING>`; —; No; —; —; maxLength=1; `dataProfile[dataProfile.format] = csv`;
- `defaultXlsxSheetName` — `<STRING>`; —; No; —; —; maxLength=255; `dataProfile[dataProfile.format] = xlsx`;
- `skipRows` — `<NUMBER>`; —; No; —; —; —; `dataProfile[dataProfile.format] = csv` or `dataProfile[dataProfile.format] = xlsx`;
- `firstLineContainsHeaders` — `<BOOLEAN>`; —; Yes; `Y`; —; —; `dataProfile[dataProfile.format] = csv` or `dataProfile[dataProfile.format] = xlsx`;

### subscription

- `master` — `<@dataLoadDefinition>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### dataProfile

- `format` — `<STRING>`; —; Yes; `JSON`; `<enum:[csv:"CSV", json:"JSON", xlsx:"XLSX", xml:"XML"]>`; —; —;
- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `rowSelector` — `<STRING>`; —; No; —; —; maxLength=255; `dataProfile[dataProfile.format] = json` or `dataProfile[dataProfile.format] = xml`;
- `useRawSelectors` — `<BOOLEAN>`; —; Yes; `N`; —; —; `dataProfile[dataProfile.format] = json`;

