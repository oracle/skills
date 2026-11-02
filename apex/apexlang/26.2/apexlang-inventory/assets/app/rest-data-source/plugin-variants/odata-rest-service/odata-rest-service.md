# plugin-variants/odataRestService

- componentType: `restDataSource`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a name of the REST Data Source.; Yes; —; —; maxLength=255; —;

### authentication

- `credentials` — `<@webCredential>`; —; No; —; —; lovType=COMPONENT; —;
- `server` — `<@authenticationServer>`; —; No; —; —; lovType=COMPONENT; `restDataSource[authentication.credentials] = sample`;
- `urlPathPrefix` — `<STRING>`; —; No; —; —; maxLength=500; `restDataSource[authentication.credentials] = sample` and `restDataSource[authentication.server] = sample`;

### source

- `type` — `<STRING>`; —; Yes; —; `<enum:[odataRestService:"OData REST Service"]>`; —; —;
- `urlPathPrefix` — `<STRING>`; —; Yes; —; —; maxLength=500; —;
- `remoteServer` — `<@restDataSourceServer>`; —; Yes; —; —; lovType=COMPONENT; —;
- `remoteServer` — `<@restEnabledSqlDatabase>`; —; Yes; —; —; lovType=COMPONENT; —;

### advanced

- `httpTransferTimeout` — `<INTEGER>`; —; No; —; —; —; —;
- `openapiUrl` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `staticId` — `<STRING>`; Use the Static ID to reference the REST Data Source in API Calls.; Yes; —; —; maxLength=255; —;
- `passEcid` — `<STRING>`; —; No; —; —; —; —;
- `encoding` — `<STRING>`; —; No; —; `<enum:[iso-8859-6:"Arabic ISO-8859-6", windows-1256:"Arabic Windows 1256", big5:"Chinese Big5", gbk:"Chinese GBK", iso-8859-5:"Cyrillic ISO-8859-5", koi8-r:"Cyrillic KOI8-R", koi8-u:"Cyrillic KOI8-U", windows-1251:"Cyrillic Windows 1251", iso-8859-2:"Eastern European ISO-8859-2", windows-1250:"Eastern European Windows 1250", iso-8859-7:"Greek ISO-8859-7", windows-1253:"Greek Windows 1253", iso-8859-8-i:"Hebrew ISO-8859-8-i", windows-1255:"Hebrew Windows 1255", euc-jp:"Japanese EUC", shift-jis:"Japanese Shift JIS", euc-kr:"Korean EUC", iso-8859-4:"Northern European ISO-8859-4", windows-1257:"Northern European Windows 1257", iso-8859-3:"Southern European ISO-8859-3", tis-620:"Thai TIS-620", iso-8859-9:"Turkish ISO-8859-9", windows-1254:"Turkish Windows 1254", us-ascii:"US-ASCII", utf-16be:"Unicode UTF-16 Big Endian", utf-16le:"Unicode UTF-16 Little Endian", utf-8:"Unicode UTF-8", windows-1258:"Vietnamese Windows 1258", iso-8859-1:"Western European ISO-8859-1", windows-1252:"Western European Windows 1252"]>`; —; —;
- `numericChars` — `<STRING>`; —; No; —; —; maxLength=2; —;
- `xmlNamespaces` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `csvSeparator` — `<STRING>`; —; No; —; —; maxLength=5; —;
- `csvEnclosedBy` — `<STRING>`; —; No; —; —; maxLength=1; —;
- `skipRows` — `<NUMBER>`; —; No; —; —; —; —;
- `firstLineContainsHeaders` — `<BOOLEAN>`; —; Yes; `Y`; —; —; —;

### synchronization

- `jobIsActive` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `localTableOwner` — `<STRING>`; —; No; —; —; —; —;
- `localTableName` — `<STRING>`; —; No; —; —; maxLength=128; —;
- `nestedRows` — `<@dataProfileColumn>`; —; No; —; —; lovType=COMPONENT; `restDataSource[synchronization.localTableName] = sample`;
- `type` — `<STRING>`; —; Yes; `APPEND`; `<enum:[append:"Append", merge:"Merge", fullRefreshDelete:"Full Refresh - Delete", fullRefreshTruncate:"Full Refresh - Truncate"]>`; —; `restDataSource[synchronization.localTableName] = sample`;
- `schedule` — `<STRING>`; —; No; —; —; maxLength=255; `restDataSource[synchronization.localTableName] = sample`;
- `commitInterval` — `<INTEGER>`; —; No; —; —; —; `restDataSource[synchronization.localTableName] = sample`;
- `httpRequestLimit` — `<INTEGER>`; —; No; —; —; —; `restDataSource[synchronization.localTableName] = sample`;

### subscription

- `master` — `<@restDataSource>`; —; No; —; —; lovType=COMPONENT; —;

### restSourceCatalog

- `name` — `<STRING>`; —; No; —; —; —; —;
- `service` — `<STRING>`; —; No; —; —; —; —;
- `version` — `<STRING>`; —; No; —; —; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### settings

- `supportedOdataFilters` — `<STRING>`; —; No; —; `<enum:[endsWith:"Ends With", startsWith:"Starts With", in:"In", contains:"Contains"]>`; maxLength=4000; —;
- `paramDefaultValues` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `returnTotalResultCount` — `<STRING>`; —; Yes; `count_none`; `<enum:[inlineInResponseAllpages:"Inline in Response ("allpages")", notSupported:"Not Supported", inlineInResponse:"Inline in Response", separateHttpRequest:"Separate HTTP Request"]>`; maxLength=4000; —;
- `resourcePath` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `sendQueryOptions` — `<STRING>`; —; Yes; `N`; `<enum:[appendToUrl:"Append to URL", passAsRequestBody:"Pass as Request Body"]>`; maxLength=4000; —;
- `supportedOdataOptions` — `<STRING>`; —; No; —; `<enum:[rowSearch:"Row Search", returnSortedResults:"Return Sorted Results", resultsPagination:"Results Pagination", supportsEtag:"Supports ETag", returnOnlySpecificCols:" Return only Specific Columns"]>`; maxLength=4000; —;
- `caseInsensitiveFiltering` — `<STRING>`; —; Yes; `none`; `<enum:[notSupported:"Not Supported", basedOnUpperCase:"Based on Upper Case", basedOnLowerCase:"Based on Lower Case"]>`; maxLength=4000; —;

### dataProfile

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `format` — `<STRING>`; —; Yes; `JSON`; `<enum:[csv:"CSV", json:"JSON", xml:"XML"]>`; —; —;
- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;
- `rowSelector` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `containsSingleRow` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `useRawSelectors` — `<BOOLEAN>`; —; Yes; `N`; —; —; —;
- `singleRowSelector` — `<STRING>`; —; No; —; —; maxLength=255; —;

### invocationScope

- `type` — `<STRING>`; —; No; —; `<enum:[staticValue:"Static Value", item:"Item", sqlQuery:"SQL Query (return single value)", expression:"Expression", functionBody:"Function Body"]>`; —; `restDataSource[authentication.credentials] = sample`;
- `text` — `<STRING>`; —; Yes; —; —; —; `restDataSource[authentication.credentials] = sample` and `restDataSource[invocationScope.type] = staticValue`;
- `item` — `<STRING>`; —; Yes; —; —; maxLength=255, textCase=UPPER; `restDataSource[authentication.credentials] = sample` and `restDataSource[invocationScope.type] = staticValue`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `restDataSource[authentication.credentials] = sample` and `restDataSource[invocationScope.type] = sqlQuery`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `restDataSource[authentication.credentials] = sample` and `restDataSource[invocationScope.type] = functionBody`;
- `language` — `<STRING>`; —; Yes; `PLSQL`; `<enum:[sql:"SQL", plsql:"PL/SQL", javaScript-mle:"JavaScript (MLE)"]>`; —; `restDataSource[authentication.credentials] = sample` and `restDataSource[invocationScope.type] = expression`;
- `plsqlFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `restDataSource[authentication.credentials] = sample` and `restDataSource[invocationScope.type] = functionBody` and `restDataSource[invocationScope.language] = plsql`;
- `javaScriptFunctionBody` — `<STRING>`; —; Yes; —; —; maxLength=4000; `restDataSource[authentication.credentials] = sample` and `restDataSource[invocationScope.type] = functionBody` and `restDataSource[invocationScope.language] = javaScript-mle`;
- `sqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `restDataSource[authentication.credentials] = sample` and `restDataSource[invocationScope.type] = expression` and `restDataSource[invocationScope.language] = sql`;
- `plsqlExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `restDataSource[authentication.credentials] = sample` and `restDataSource[invocationScope.type] = expression` and `restDataSource[invocationScope.language] = plsql`;
- `javaScriptExpression` — `<STRING>`; —; Yes; —; —; maxLength=4000; `restDataSource[authentication.credentials] = sample` and `restDataSource[invocationScope.type] = expression` and `restDataSource[invocationScope.language] = javaScript-mle`;

### synchronizationRateLimit

- `timeframe` — `<INTEGER>`; —; No; —; —; —; `restDataSource[synchronization.localTableName] = sample`;
- `httpRequests` — `<INTEGER>`; —; Yes; —; —; —; `restDataSource[synchronization.localTableName] = sample` and `restDataSource[synchronizationRateLimit.timeframe] = sample`;
- `whenExceeded` — `<STRING>`; —; Yes; `ERROR`; `<enum:[raiseError:"Raise Error", wait:"Wait"]>`; —; `restDataSource[synchronization.localTableName] = sample` and `restDataSource[synchronizationRateLimit.timeframe] = sample`;

