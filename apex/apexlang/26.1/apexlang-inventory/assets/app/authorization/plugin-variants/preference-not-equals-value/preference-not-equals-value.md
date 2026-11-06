# plugin-variants/preferenceNotEqualsValue

- componentType: `authorization`
- identifierRequired: true

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `type` — `<STRING>`; —; Yes; —; `<enum:[preferenceNotEqualsValue:"Preference does NOT equal Value"]>`; —; —;

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

- `value` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;
- `preferenceName` — `<STRING>`; —; Yes; —; —; maxLength=4000; —;

