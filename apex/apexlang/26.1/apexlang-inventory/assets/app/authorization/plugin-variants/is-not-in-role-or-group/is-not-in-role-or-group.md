# plugin-variants/isNotInRoleOrGroup

- componentType: `authorization`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[isNotInRoleOrGroup:"Is Not In Role or Group"]>`; —; —;

### subscription

- `master` — `<@authorization>`; —; No; —; —; lovType=COMPONENT; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `evaluationType` — `<STRING>`; —; Yes; `BY_USER_BY_PAGE_VIEW`; `<enum:[perSession:"Once per Session", perPageView:"Once per Page View", perComponent:"Once per Component", always:"Always (No Caching)"]>`; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### error

- `errorMessage` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### settings

- `type` — `<STRING>`; —; Yes; `A`; `<enum:[workspaceGroup:"Workspace Group", applicationRole:"Application Role", custom:"Custom"]>`; maxLength=4000; —;
- `names` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

