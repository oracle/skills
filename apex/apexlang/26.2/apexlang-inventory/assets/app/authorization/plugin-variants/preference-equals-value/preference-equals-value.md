# plugin-variants/preferenceEqualsValue

- componentType: `authorization`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter an unique name that identifies this authorization scheme.; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[preferenceEqualsValue:"Preference equals Value"]>`; —; —;

### subscription

- `master` — `<@authorization>`; —; No; —; —; lovType=COMPONENT; —;

### advanced

- `staticId` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `evaluationType` — `<STRING>`; —; Yes; `BY_USER_BY_PAGE_VIEW`; `<enum:[perSession:"Once per Session", perPageView:"Once per Page View", perComponent:"Once per Component", always:"Always (No Caching)"]>`; —; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

### error

- `errorMessage` — `<STRING>`; This is the error text that displays when this authorization scheme is applied to a application or page. If the authorization scheme fails (that is, the current user fails the security check) then this text displays.; No; —; —; maxLength=4000; —;

### settings

- `preferenceName` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

