# version

- componentType: `version`
- identifierRequired: true

## Properties

### settings

- `state` — `<STRING>`; —; Yes; `DEVELOPMENT`; `<enum:[inDevelopment:"In Development", active:"Active", inactive:"Inactive"]>`; maxLength=128; —;

### identification (direct group)

- `workflowVersion` — `<STRING>`; Version of this workflow.; Yes; —; —; maxLength=255; —;

### advanced

- `diagram` — `<STRING>`; —; No; —; —; —; —;
- `debugLevel` — `<STRING>`; —; No; —; `<enum:[info:"Info", warning:"Warning", error:"Error", trace:"Trace"]>`; —; —;

### additionalData

- `type` — `<STRING>`; Select how additional data is queried that can be used to evaluate variables,         participants and conditions during the execution of the activities of the workflow..; No; —; `<enum:[tableView:"Table / View", sqlQuery:"SQL Query"]>`; —; —;
- `tableOwner` — `<STRING>`; —; No; —; —; —; `version[additionalData.type] = tableView`;
- `tableName` — `<STRING>`; —; Yes; —; —; —; `version[additionalData.type] = tableView`;
- `sqlQuery` — `<STRING>`; —; Yes; —; —; maxLength=4000; `version[additionalData.type] = sqlQuery`;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### columnMapping

- `primaryKeyColumn` — `<STRING>`; The primary key column for the table which will serve as the system of records during execution of this workflow version.; Yes; —; —; —; `version[additionalData.type] = tableView`;

