# role

- componentType: `role`
- identifierRequired: true
- filePath: `shared-components/acl-roles.apx`

## Properties

### identification (direct group)

- `name` — `<STRING>`; Enter a descriptive name for the role. This name must be unique within the application.; Yes; —; —; maxLength=255; —;

### subscription

- `master` — `<@role>`; —; No; —; —; lovType=COMPONENT; —;

### advanced

- `staticId` — `<STRING>`; Use the Static ID to reference the role in API Calls.; Yes; —; —; maxLength=255; —;

### description

- `description` — `<STRING>`; Enter a description for this role.; No; —; —; maxLength=4000; —;

