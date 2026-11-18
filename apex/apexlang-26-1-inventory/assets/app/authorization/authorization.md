# authorization

- componentType: `authorization`
- identifierRequired: true
- filePath: `shared-components/authorizations.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[existsSqlQuery:"Exists SQL Query", existsSqlQuery:"Exists SQL Query", isInRoleOrGroup:"Is In Role or Group", isInRoleOrGroup:"Is In Role or Group", isNotInRoleOrGroup:"Is Not In Role or Group", isNotInRoleOrGroup:"Is Not In Role or Group", itemEqualsValue:"Item equals Value", itemEqualsValue:"Item equals Value", itemIsNotNull:"Item is NOT NULL", itemIsNotNull:"Item is NOT NULL", itemIsNull:"Item is NULL", itemIsNull:"Item is NULL", itemNotEqualsValue:"Item does NOT equal Value", itemNotEqualsValue:"Item does NOT equal Value", notExistsSqlQuery:"NOT Exists SQL Query", notExistsSqlQuery:"NOT Exists SQL Query", plSqlFunctionBody:"PL/SQL Function Returning Boolean", plSqlFunctionBody:"PL/SQL Function Returning Boolean", preferenceEqualsValue:"Preference equals Value", preferenceEqualsValue:"Preference equals Value", preferenceNotEqualsValue:"Preference does NOT equal Value", preferenceNotEqualsValue:"Preference does NOT equal Value"]>`; —; —;

### subscription

- `master` — `<@authorization>`; —; No; —; —; lovType=COMPONENT; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `evaluationType` — `<STRING>`; —; Yes; `BY_USER_BY_PAGE_VIEW`; `<enum:[perSession:"Once per Session", perPageView:"Once per Page View", perComponent:"Once per Component", always:"Always (No Caching)"]>`; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### error

- `errorMessage` — `<STRING>`; —; No; —; —; maxLength=4000; —;

