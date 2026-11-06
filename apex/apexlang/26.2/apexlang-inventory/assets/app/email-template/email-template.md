# emailTemplate

- componentType: `emailTemplate`
- identifierRequired: true
- filePath: `shared-components/email-templates/<filename>.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; —; Yes; —; —; maxLength=255; —;
- `emailSubject` — `<STRING>`; —; Yes; —; —; maxLength=255; —;

### htmlFormat

- `header` — `<STRING>`; —; No; —; —; —; —;
- `body` — `<STRING>`; —; Yes; —; —; —; —;
- `footer` — `<STRING>`; —; No; —; —; —; —;

### advanced

- `htmlTemplate` — `<STRING>`; —; No; —; —; —; —;
- `versionNumber` — `<STRING>`; —; No; —; `<enum:[1:"1", 2:"2"]>`; —; —;
- `staticId` — `<STRING>`; This identifier is used in the APEX_MAIL API call to reference this template.; Yes; —; —; maxLength=255; —;

### plainTextFormat

- `content` — `<STRING>`; —; No; —; —; —; —;

### subscription

- `master` — `<@emailTemplate>`; —; No; —; —; lovType=COMPONENT; —;

### comments

- `comments` — `<STRING>`; —; No; —; —; maxLength=4000; —;

