# operation

- componentType: `operation`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `label` — `<STRING>`; —; No; —; —; maxLength=255; —;

### operation

- `databaseOperation` — `<STRING>`; —; No; —; `<enum:[fetchRows:"Fetch Rows", fetchSingleRow:"Fetch Single Row", insert:"Insert Row", update:"Update Row", delete:"Delete Row"]>`; —; —;
- `httpMethod` — `<STRING>`; —; Yes; —; `<enum:[get:"GET", post:"POST", put:"PUT", delete:"DELETE", patch:"PATCH"]>`; —; —;
- `urlPattern` — `<STRING>`; —; Yes; —; —; maxLength=500; —;

### advanced

- `fixedPageSize` — `<INTEGER>`; —; No; —; —; —; —;
- `staticId` — `<STRING>`; —; No; —; —; maxLength=255; —;
- `allowFetchingAllRows` — `<BOOLEAN>`; —; Yes; `N`; —; —; `operation[operation.databaseOperation] = fetchRows`;
- `forceRaiseHttp404Error` — `<BOOLEAN>`; —; Yes; `N`; —; —; `operation[operation.databaseOperation] = fetchRows`;
- `fetchAllRowsTimeout` — `<INTEGER>`; —; No; —; —; —; `operation[operation.databaseOperation] = fetchRows` and `operation[advanced.allowFetchingAllRows] = Y`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### dataProfile

- `nestedRows` — `<@dataProfileColumn>`; —; No; —; —; lovType=COMPONENT; —;

### requestBody

- `template` — `<STRING>`; —; No; —; —; maxLength=32760; —;
- `versionNumber` — `<STRING>`; —; Yes; `2`; `<enum:[1:"1", 2:"2"]>`; —; —;

### remoteCache

- `caching` — `<STRING>`; —; No; —; `<enum:[allUsers:"For All Users", user:"By User", session:"By Session"]>`; —; `operation[operation.httpMethod] = get` and `operation[operation.databaseOperation] = fetchRows` or `operation[operation.httpMethod] = get` and `operation[operation.databaseOperation] = fetchSingleRow` or `operation[operation.httpMethod] = post` and `operation[operation.databaseOperation] = fetchRows` or `operation[operation.httpMethod] = post` and `operation[operation.databaseOperation] = fetchSingleRow`;
- `timeout` — `<STRING>`; —; No; —; —; maxLength=255; `operation[operation.httpMethod] = get` and `operation[operation.databaseOperation] = fetchRows` and `operation[remoteCache.caching] = sample` or `operation[operation.httpMethod] = get` and `operation[operation.databaseOperation] = fetchSingleRow` and `operation[remoteCache.caching] = sample` or `operation[operation.httpMethod] = post` and `operation[operation.databaseOperation] = fetchRows` and `operation[remoteCache.caching] = sample` or `operation[operation.httpMethod] = post` and `operation[operation.databaseOperation] = fetchSingleRow` and `operation[remoteCache.caching] = sample`;

